const fs = require('fs');
const file = 'src/orchestrator/agent.ts';
let code = fs.readFileSync(file, 'utf8');

// Replace gemini-1.5-flash with gemini-2.5-flash
code = code.replace(/model: 'gemini-1.5-flash'/g, "model: 'gemini-2.5-flash'");

fs.writeFileSync(file, code, 'utf8');
console.log('Switched model to gemini-2.5-flash');
