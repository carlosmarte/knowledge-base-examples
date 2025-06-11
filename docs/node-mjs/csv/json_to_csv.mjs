#!/usr/bin/env node

/**
 * JSON to CSV Converter CLI Tool
 * 
 * Features:
 * - Convert JSON arrays to CSV format
 * - Stream processing for large files
 * - Flexible input/output options
 * - Custom delimiter support
 * - Header customization
 * - Progress indication
 * - Verbose and debug modes
 * 
 * Use Cases:
 * - Data export from APIs
 * - Database dump conversion
 * - Report generation
 * - Data pipeline processing
 * - Batch file conversion
 */

import { createReadStream, createWriteStream, existsSync, statSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { pipeline } from 'stream/promises';
import { Transform } from 'stream';
import { resolve, extname, basename } from 'path';
import { parseArgs } from 'util';

class JSONToCSVConverter {
    constructor(options = {}) {
        this.delimiter = options.delimiter || ',';
        this.quote = options.quote || '"';
        this.newline = options.newline || '\n';
        this.headers = options.headers || null;
        this.verbose = options.verbose || false;
        this.debug = options.debug || false;
        this.flatten = options.flatten || false;
        this.maxDepth = options.maxDepth || 3;
    }

    log(message, level = 'info') {
        if (level === 'debug' && !this.debug) return;
        if (level === 'verbose' && !this.verbose && !this.debug) return;
        
        const timestamp = new Date().toISOString();
        const prefix = level === 'error' ? '❌' : level === 'debug' ? '🐛' : level === 'verbose' ? '📝' : '✅';
        console.error(`${prefix} [${timestamp}] ${message}`);
    }

    // Flatten nested objects for CSV conversion
    flattenObject(obj, prefix = '', maxDepth = this.maxDepth, currentDepth = 0) {
        if (currentDepth >= maxDepth) {
            return { [prefix.slice(0, -1) || 'value']: JSON.stringify(obj) };
        }

        const flattened = {};
        
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const value = obj[key];
                const newKey = prefix ? `${prefix}${key}` : key;
                
                if (value === null || value === undefined) {
                    flattened[newKey] = '';
                } else if (typeof value === 'object' && !Array.isArray(value)) {
                    if (this.flatten) {
                        Object.assign(flattened, this.flattenObject(value, `${newKey}.`, maxDepth, currentDepth + 1));
                    } else {
                        flattened[newKey] = JSON.stringify(value);
                    }
                } else if (Array.isArray(value)) {
                    flattened[newKey] = JSON.stringify(value);
                } else {
                    flattened[newKey] = value;
                }
            }
        }
        
        return flattened;
    }

    // Escape CSV field values
    escapeCSVField(field) {
        if (field === null || field === undefined) return '';
        
        const stringField = String(field);
        
        // If field contains delimiter, quote, or newline, wrap in quotes and escape internal quotes
        if (stringField.includes(this.delimiter) || stringField.includes(this.quote) || stringField.includes('\n') || stringField.includes('\r')) {
            return this.quote + stringField.replace(new RegExp(this.quote, 'g'), this.quote + this.quote) + this.quote;
        }
        
        return stringField;
    }

    // Get all unique keys from JSON array
    extractHeaders(jsonArray) {
        const headerSet = new Set();
        
        for (const item of jsonArray) {
            if (typeof item === 'object' && item !== null) {
                const flattened = this.flattenObject(item);
                Object.keys(flattened).forEach(key => headerSet.add(key));
            }
        }
        
        return Array.from(headerSet).sort();
    }

    // Convert single JSON object to CSV row
    jsonToCsvRow(jsonObj, headers) {
        const flattened = this.flattenObject(jsonObj);
        const row = headers.map(header => this.escapeCSVField(flattened[header] || ''));
        return row.join(this.delimiter);
    }

    // Convert JSON array to CSV string
    async convertJSONToCSV(jsonArray) {
        if (!Array.isArray(jsonArray)) {
            throw new Error('Input must be an array of objects');
        }

        if (jsonArray.length === 0) {
            this.log('Warning: Empty JSON array provided', 'verbose');
            return '';
        }

        this.log(`Processing ${jsonArray.length} records`, 'verbose');

        // Extract headers
        const headers = this.headers || this.extractHeaders(jsonArray);
        this.log(`Headers: ${headers.join(', ')}`, 'debug');

        // Create CSV content
        const csvRows = [];
        
        // Add header row
        csvRows.push(headers.map(h => this.escapeCSVField(h)).join(this.delimiter));
        
        // Add data rows with progress indication
        const total = jsonArray.length;
        const showProgress = total > 1000 && (this.verbose || this.debug);
        
        for (let i = 0; i < jsonArray.length; i++) {
            const item = jsonArray[i];
            
            if (showProgress && i % Math.ceil(total / 20) === 0) {
                const progress = Math.round((i / total) * 100);
                this.log(`Progress: ${progress}% (${i}/${total})`, 'verbose');
            }
            
            try {
                csvRows.push(this.jsonToCsvRow(item, headers));
            } catch (error) {
                this.log(`Error processing row ${i}: ${error.message}`, 'error');
                if (this.debug) {
                    console.error('Problematic row:', JSON.stringify(item, null, 2));
                }
                throw error;
            }
        }

        if (showProgress) {
            this.log('Progress: 100% - Conversion complete', 'verbose');
        }

        return csvRows.join(this.newline);
    }

    // Create streaming transform for large files
    createStreamTransform(headers = null) {
        let isFirstChunk = true;
        let buffer = '';
        let recordCount = 0;
        const extractedHeaders = headers ? headers.slice() : null;

        return new Transform({
            objectMode: false,
            transform(chunk, encoding, callback) {
                buffer += chunk.toString();
                
                try {
                    // Try to parse complete JSON
                    const jsonData = JSON.parse(buffer);
                    
                    if (!Array.isArray(jsonData)) {
                        return callback(new Error('JSON must be an array for streaming conversion'));
                    }

                    // Extract headers if not provided
                    const finalHeaders = extractedHeaders || this.extractHeaders(jsonData);
                    
                    let csvOutput = '';
                    
                    // Add headers on first chunk
                    if (isFirstChunk) {
                        csvOutput += finalHeaders.map(h => this.escapeCSVField(h)).join(this.delimiter) + this.newline;
                        isFirstChunk = false;
                    }
                    
                    // Convert each record
                    for (const record of jsonData) {
                        csvOutput += this.jsonToCsvRow(record, finalHeaders) + this.newline;
                        recordCount++;
                    }
                    
                    this.log(`Processed ${recordCount} records`, 'debug');
                    
                    buffer = '';
                    callback(null, csvOutput);
                    
                } catch (error) {
                    // If JSON is incomplete, keep buffering
                    if (error.message.includes('Unexpected end of JSON input')) {
                        callback();
                    } else {
                        callback(error);
                    }
                }
            }.bind(this)
        });
    }
}

// CLI Application
class JSONToCSVCLI {
    constructor() {
        this.converter = null;
    }

    showHelp() {
        console.log(`
JSON to CSV Converter CLI

USAGE:
  json-to-csv [OPTIONS] [INPUT_FILE] [OUTPUT_FILE]

ARGUMENTS:
  INPUT_FILE      Input JSON file path (defaults to stdin)
  OUTPUT_FILE     Output CSV file path (defaults to stdout)

OPTIONS:
  -d, --delimiter <char>      CSV delimiter (default: ',')
  -q, --quote <char>          Quote character (default: '"')
  -n, --newline <char>        Newline character (default: '\\n')
  -H, --headers <list>        Custom headers (comma-separated)
  -f, --flatten               Flatten nested objects
  -m, --max-depth <num>       Maximum depth for flattening (default: 3)
  -s, --stream                Use streaming mode for large files
  -v, --verbose               Enable verbose logging
  -D, --debug                 Enable debug logging
  -h, --help                  Show this help message
  -V, --version               Show version information

EXAMPLES:
  # Convert JSON file to CSV
  json-to-csv data.json output.csv

  # Convert with custom delimiter
  json-to-csv -d ';' data.json output.csv

  # Stream large file conversion
  json-to-csv -s -v large-data.json output.csv

  # Use stdin/stdout
  cat data.json | json-to-csv > output.csv

  # Custom headers
  json-to-csv -H "Name,Age,Email" users.json users.csv

  # Flatten nested objects
  json-to-csv -f -m 2 nested-data.json flat-output.csv
`);
    }

    parseArguments() {
        try {
            const { values, positionals } = parseArgs({
                options: {
                    delimiter: { type: 'string', short: 'd', default: ',' },
                    quote: { type: 'string', short: 'q', default: '"' },
                    newline: { type: 'string', short: 'n', default: '\n' },
                    headers: { type: 'string', short: 'H' },
                    flatten: { type: 'boolean', short: 'f', default: false },
                    'max-depth': { type: 'string', short: 'm', default: '3' },
                    stream: { type: 'boolean', short: 's', default: false },
                    verbose: { type: 'boolean', short: 'v', default: false },
                    debug: { type: 'boolean', short: 'D', default: false },
                    help: { type: 'boolean', short: 'h', default: false },
                    version: { type: 'boolean', short: 'V', default: false }
                },
                allowPositionals: true
            });

            return {
                options: {
                    ...values,
                    maxDepth: parseInt(values['max-depth'], 10),
                    headers: values.headers ? values.headers.split(',').map(h => h.trim()) : null
                },
                positionals
            };
        } catch (error) {
            throw new Error(`Invalid arguments: ${error.message}`);
        }
    }

    async validateInputFile(filePath) {
        if (!existsSync(filePath)) {
            throw new Error(`Input file not found: ${filePath}`);
        }

        const stats = statSync(filePath);
        if (!stats.isFile()) {
            throw new Error(`Input path is not a file: ${filePath}`);
        }

        if (extname(filePath).toLowerCase() !== '.json') {
            console.warn(`Warning: Input file doesn't have .json extension: ${filePath}`);
        }

        return stats;
    }

    async readJSONFromFile(filePath) {
        this.converter.log(`Reading JSON from file: ${filePath}`, 'verbose');
        
        try {
            const content = await readFile(filePath, 'utf8');
            const jsonData = JSON.parse(content);
            
            this.converter.log(`Successfully parsed JSON with ${Array.isArray(jsonData) ? jsonData.length : 1} records`, 'verbose');
            return jsonData;
        } catch (error) {
            if (error instanceof SyntaxError) {
                throw new Error(`Invalid JSON in file ${filePath}: ${error.message}`);
            }
            throw error;
        }
    }

    async readJSONFromStdin() {
        this.converter.log('Reading JSON from stdin...', 'verbose');
        
        return new Promise((resolve, reject) => {
            let data = '';
            
            process.stdin.setEncoding('utf8');
            process.stdin.on('data', chunk => data += chunk);
            process.stdin.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    this.converter.log(`Successfully parsed JSON from stdin`, 'verbose');
                    resolve(jsonData);
                } catch (error) {
                    reject(new Error(`Invalid JSON from stdin: ${error.message}`));
                }
            });
            process.stdin.on('error', reject);
        });
    }

    async writeCSVToFile(csvContent, filePath) {
        this.converter.log(`Writing CSV to file: ${filePath}`, 'verbose');
        
        try {
            await writeFile(filePath, csvContent, 'utf8');
            this.converter.log(`Successfully wrote CSV to ${filePath}`, 'verbose');
        } catch (error) {
            throw new Error(`Failed to write CSV file: ${error.message}`);
        }
    }

    writeCSVToStdout(csvContent) {
        this.converter.log('Writing CSV to stdout', 'verbose');
        process.stdout.write(csvContent);
    }

    async streamConversion(inputPath, outputPath) {
        this.converter.log('Starting streaming conversion...', 'verbose');
        
        const readStream = createReadStream(inputPath, { encoding: 'utf8' });
        const writeStream = outputPath ? createWriteStream(outputPath, { encoding: 'utf8' }) : process.stdout;
        const transformStream = this.converter.createStreamTransform();

        try {
            await pipeline(readStream, transformStream, writeStream);
            this.converter.log('Streaming conversion completed successfully', 'verbose');
        } catch (error) {
            throw new Error(`Streaming conversion failed: ${error.message}`);
        }
    }

    async run() {
        try {
            const { options, positionals } = this.parseArguments();

            if (options.help) {
                this.showHelp();
                return;
            }

            if (options.version) {
                console.log('JSON to CSV Converter v1.0.0');
                return;
            }

            // Initialize converter with options
            this.converter = new JSONToCSVConverter(options);

            const inputFile = positionals[0];
            const outputFile = positionals[1];

            this.converter.log(`Starting conversion...`, 'verbose');
            this.converter.log(`Input: ${inputFile || 'stdin'}`, 'debug');
            this.converter.log(`Output: ${outputFile || 'stdout'}`, 'debug');
            this.converter.log(`Options: ${JSON.stringify(options)}`, 'debug');

            // Streaming mode for large files
            if (options.stream && inputFile) {
                await this.validateInputFile(inputFile);
                await this.streamConversion(inputFile, outputFile);
                return;
            }

            // Standard mode
            let jsonData;
            
            if (inputFile) {
                await this.validateInputFile(inputFile);
                jsonData = await this.readJSONFromFile(inputFile);
            } else {
                jsonData = await this.readJSONFromStdin();
            }

            // Convert JSON to CSV
            const csvContent = await this.converter.convertJSONToCSV(jsonData);

            // Output CSV
            if (outputFile) {
                await this.writeCSVToFile(csvContent, outputFile);
            } else {
                this.writeCSVToStdout(csvContent);
            }

            this.converter.log('Conversion completed successfully!', 'verbose');

        } catch (error) {
            console.error(`❌ Error: ${error.message}`);
            
            if (this.converter && this.converter.debug) {
                console.error('\n🐛 Debug Information:');
                console.error(error.stack);
            }
            
            process.exit(1);
        }
    }
}

// Execute CLI if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
    const cli = new JSONToCSVCLI();
    cli.run();
}

export { JSONToCSVConverter, JSONToCSVCLI };
