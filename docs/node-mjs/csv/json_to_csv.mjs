#!/usr/bin/env node

/*
JSON Report Structure:
{
  "data": [
    { "column1": "value1", "column2": "value2", ... },
    { "column1": "value3", "column2": "value4", ... }
  ],
  "metadata": {
    "totalRecords": 100,
    "columns": ["column1", "column2"],
    "generatedAt": "2024-01-15T10:30:00Z"
  }
}

Use Cases:
- Convert API response JSON to CSV for spreadsheet analysis
- Transform database exports from JSON to CSV format
- Process streaming JSON data and output CSV in real-time
- Extract specific columns from large JSON datasets
- Batch processing of multiple JSON files to CSV
- Data pipeline integration for reporting systems
*/

import fs from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';
import { Transform } from 'stream';
import { pipeline } from 'stream/promises';
import { parseArgs } from 'util';
import { dirname, join, basename, extname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class CSVGenerator {
  constructor(options = {}) {
    this.options = {
      verbose: false,
      debug: false,
      delimiter: ',',
      quote: '"',
      escape: '"',
      maxRetries: 3,
      retryDelay: 1000,
      ...options
    };
    this.retryCount = 0;
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    if (level === 'debug' && !this.options.debug) return;
    if (level === 'verbose' && !this.options.verbose && !this.options.debug) return;
    
    console.log(`${prefix} ${message}`);
  }

  error(message, error = null) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [ERROR] ${message}`);
    if (error && this.options.debug) {
      console.error(error);
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async retryOperation(operation, context = '') {
    let lastError;
    
    for (let attempt = 0; attempt <= this.options.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          this.log(`Retry attempt ${attempt}/${this.options.maxRetries} for ${context}`, 'verbose');
          await this.sleep(this.options.retryDelay * attempt);
        }
        
        return await operation();
      } catch (error) {
        lastError = error;
        this.log(`Attempt ${attempt + 1} failed for ${context}: ${error.message}`, 'debug');
      }
    }
    
    throw lastError;
  }

  escapeCSVField(field) {
    if (field === null || field === undefined) return '';
    
    const str = String(field);
    const needsQuoting = str.includes(this.options.delimiter) || 
                        str.includes(this.options.quote) || 
                        str.includes('\n') || 
                        str.includes('\r');
    
    if (needsQuoting) {
      const escaped = str.replace(new RegExp(this.options.quote, 'g'), this.options.escape + this.options.quote);
      return this.options.quote + escaped + this.options.quote;
    }
    
    return str;
  }

  extractColumns(data, columns = null) {
    if (!Array.isArray(data)) return [];
    if (data.length === 0) return [];
    
    // If no columns specified, extract all unique columns from the data
    if (!columns) {
      const columnSet = new Set();
      data.forEach(item => {
        if (typeof item === 'object' && item !== null) {
          Object.keys(item).forEach(key => columnSet.add(key));
        }
      });
      columns = Array.from(columnSet);
    }
    
    this.log(`Extracting columns: ${columns.join(', ')}`, 'verbose');
    return columns;
  }

  async parseJSON(input) {
    return await this.retryOperation(async () => {
      this.log('Parsing JSON input...', 'verbose');
      
      let jsonStr;
      if (typeof input === 'string') {
        // Check if it's a file path or JSON string
        try {
          await fs.access(input);
          jsonStr = await fs.readFile(input, 'utf-8');
          this.log(`Read JSON from file: ${input}`, 'verbose');
        } catch {
          // Assume it's a JSON string
          jsonStr = input;
          this.log('Parsing JSON string directly', 'verbose');
        }
      } else {
        jsonStr = JSON.stringify(input);
      }
      
      const parsed = JSON.parse(jsonStr);
      this.log(`Successfully parsed JSON with ${Array.isArray(parsed) ? parsed.length : 'object'} items`, 'verbose');
      return parsed;
    }, 'JSON parsing');
  }

  generateCSVHeader(columns) {
    return columns.map(col => this.escapeCSVField(col)).join(this.options.delimiter);
  }

  generateCSVRow(item, columns) {
    return columns.map(col => {
      const value = item && typeof item === 'object' ? item[col] : '';
      return this.escapeCSVField(value);
    }).join(this.options.delimiter);
  }

  createJSONToCSVTransform(columns) {
    let isFirstChunk = true;
    let buffer = '';
    
    return new Transform({
      objectMode: false,
      transform(chunk, encoding, callback) {
        try {
          buffer += chunk.toString();
          
          // Try to parse complete JSON objects from buffer
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer
          
          let output = '';
          
          for (const line of lines) {
            if (line.trim()) {
              try {
                const item = JSON.parse(line.trim());
                if (isFirstChunk && columns) {
                  output += this.generateCSVHeader(columns) + '\n';
                  isFirstChunk = false;
                }
                output += this.generateCSVRow(item, columns) + '\n';
              } catch (parseError) {
                this.error(`Failed to parse JSON line: ${line}`, parseError);
              }
            }
          }
          
          callback(null, output);
        } catch (error) {
          callback(error);
        }
      }.bind(this),
      
      flush(callback) {
        try {
          let output = '';
          if (buffer.trim()) {
            const item = JSON.parse(buffer.trim());
            if (isFirstChunk && columns) {
              output += this.generateCSVHeader(columns) + '\n';
            }
            output += this.generateCSVRow(item, columns) + '\n';
          }
          callback(null, output);
        } catch (error) {
          callback(error);
        }
      }
    });
  }

  async convertToCSV(jsonData, columns = null, outputPath = null) {
    return await this.retryOperation(async () => {
      this.log('Starting CSV conversion...', 'verbose');
      
      const parsed = await this.parseJSON(jsonData);
      
      // Handle different JSON structures
      let dataArray;
      if (Array.isArray(parsed)) {
        dataArray = parsed;
      } else if (parsed && typeof parsed === 'object') {
        // Look for common array properties
        if (parsed.data && Array.isArray(parsed.data)) {
          dataArray = parsed.data;
        } else if (parsed.items && Array.isArray(parsed.items)) {
          dataArray = parsed.items;
        } else if (parsed.results && Array.isArray(parsed.results)) {
          dataArray = parsed.results;
        } else {
          // Convert single object to array
          dataArray = [parsed];
        }
      } else {
        throw new Error('Invalid JSON structure: expected array or object');
      }
      
      const extractedColumns = this.extractColumns(dataArray, columns);
      
      if (extractedColumns.length === 0) {
        throw new Error('No columns found in the data');
      }
      
      const csvHeader = this.generateCSVHeader(extractedColumns);
      const csvRows = dataArray.map(item => this.generateCSVRow(item, extractedColumns));
      
      const csvContent = [csvHeader, ...csvRows].join('\n');
      
      if (outputPath) {
        await fs.writeFile(outputPath, csvContent, 'utf-8');
        this.log(`CSV written to: ${outputPath}`, 'info');
      }
      
      this.log(`Converted ${dataArray.length} records to CSV`, 'info');
      return csvContent;
    }, 'CSV conversion');
  }

  async streamConvert(inputPath, outputPath, columns = null) {
    return await this.retryOperation(async () => {
      this.log(`Starting stream conversion from ${inputPath} to ${outputPath}`, 'verbose');
      
      const readStream = createReadStream(inputPath);
      const writeStream = createWriteStream(outputPath);
      const transform = this.createJSONToCSVTransform(columns);
      
      await pipeline(readStream, transform, writeStream);
      
      this.log(`Stream conversion completed: ${outputPath}`, 'info');
    }, 'stream conversion');
  }
}

function showHelp() {
  console.log(`
CSV Generator CLI Tool

Usage: node main.mjs [options] <input>

Arguments:
  <input>                Input JSON file path, JSON string, or '-' for stdin

Options:
  -c, --columns <cols>   Comma-separated list of columns to extract
  -o, --output <file>    Output CSV file path (default: stdout)
  -d, --delimiter <char> CSV delimiter (default: ',')
  -q, --quote <char>     CSV quote character (default: '"')
  -s, --stream           Use streaming mode for large files
  -v, --verbose          Enable verbose logging
  --debug                Enable debug logging
  -r, --retries <num>    Max retry attempts (default: 3)
  --retry-delay <ms>     Retry delay in milliseconds (default: 1000)
  -h, --help             Show this help message

Examples:
  # Convert JSON file to CSV
  node main.mjs data.json -o output.csv

  # Extract specific columns
  node main.mjs data.json -c "name,email,age" -o users.csv

  # Process from stdin
  echo '{"name":"John","age":30}' | node main.mjs - -o user.csv

  # Stream large file
  node main.mjs large-data.json -o output.csv --stream

  # Convert JSON string directly
  node main.mjs '{"users":[{"name":"John","age":30}]}' -c "name,age"
`);
}

async function main() {
  try {
    const { values, positionals } = parseArgs({
      args: process.argv.slice(2),
      options: {
        columns: { type: 'string', short: 'c' },
        output: { type: 'string', short: 'o' },
        delimiter: { type: 'string', short: 'd' },
        quote: { type: 'string', short: 'q' },
        stream: { type: 'boolean', short: 's' },
        verbose: { type: 'boolean', short: 'v' },
        debug: { type: 'boolean' },
        retries: { type: 'string', short: 'r' },
        'retry-delay': { type: 'string' },
        help: { type: 'boolean', short: 'h' }
      },
      allowPositionals: true
    });

    if (values.help) {
      showHelp();
      return;
    }

    if (positionals.length === 0) {
      console.error('Error: Input is required. Use -h for help.');
      process.exit(1);
    }

    const input = positionals[0];
    const columns = values.columns ? values.columns.split(',').map(c => c.trim()) : null;
    
    const generator = new CSVGenerator({
      verbose: values.verbose,
      debug: values.debug,
      delimiter: values.delimiter || ',',
      quote: values.quote || '"',
      maxRetries: values.retries ? parseInt(values.retries) : 3,
      retryDelay: values['retry-delay'] ? parseInt(values['retry-delay']) : 1000
    });

    let inputData;
    
    if (input === '-') {
      // Read from stdin
      generator.log('Reading from stdin...', 'verbose');
      const chunks = [];
      for await (const chunk of process.stdin) {
        chunks.push(chunk);
      }
      inputData = Buffer.concat(chunks).toString();
    } else {
      inputData = input;
    }

    if (values.stream && input !== '-' && values.output) {
      // Stream mode
      await generator.streamConvert(input, values.output, columns);
    } else {
      // Regular mode
      const csvContent = await generator.convertToCSV(inputData, columns, values.output);
      
      if (!values.output) {
        console.log(csvContent);
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
    if (process.env.NODE_ENV === 'development') {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
