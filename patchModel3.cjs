const fs = require('fs');
const file = 'src/orchestrator/agent.ts';
let code = fs.readFileSync(file, 'utf8');

// Replace gemini-2.5-flash with gemini-3.6-flash
code = code.replace(/model: 'gemini-2.5-flash'/g, "model: 'gemini-3.6-flash'");

fs.writeFileSync(file, code, 'utf8');
console.log('Switched model to gemini-3.6-flash');
