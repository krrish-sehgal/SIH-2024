const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');

const code = fs.readFileSync('ModelService.js', 'utf8');
const obfuscatedCode = JavaScriptObfuscator.obfuscate(code, {
  compact: true,
  controlFlowFlattening: true,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  deadCodeInjection: true,
  identifierNamesGenerator: 'hexadecimal'
});

fs.writeFileSync('ModelService.obfuscated.js', obfuscatedCode.getObfuscatedCode());