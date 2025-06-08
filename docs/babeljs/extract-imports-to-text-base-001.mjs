const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

/**
 * Extracts imports from source code in the format:
 * ["module" → [default: DefaultImport] + [named: Named1, Named2]]
 * 
 * @param {string} code - JavaScript or TypeScript source code
 * @returns {string[]} - Array of formatted import strings
 */
function extractImports(code) {
  const ast = parser.parse(code, {
    sourceType: "module",
    plugins: ["jsx", "typescript"],
  });

  const results = [];

  traverse(ast, {
    ImportDeclaration(path) {
      const source = path.node.source.value;
      let defaultImport = null;
      const namedImports = [];

      for (const specifier of path.node.specifiers) {
        if (specifier.type === "ImportDefaultSpecifier") {
          defaultImport = specifier.local.name;
        } else if (specifier.type === "ImportSpecifier") {
          namedImports.push(specifier.imported.name);
        }
      }

      const parts = [`"${source}" →`];
      if (defaultImport) parts.push(`[default: ${defaultImport}]`);
      if (namedImports.length > 0) parts.push(`[named: ${namedImports.join(", ")}]`);
      results.push(parts.join(" + "));
    }
  });

  return results;
}

// Example usage:
const fs = require("fs");
const path = require("path");

const inputPath = process.argv[2]; // e.g., `node extract-imports.js ./example.js`
const sourceCode = fs.readFileSync(inputPath, "utf8");

const imports = extractImports(sourceCode);
console.log(imports);
