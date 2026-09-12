const fs = require('fs');
const file = 'src/orchestrator/agent.ts';
let code = fs.readFileSync(file, 'utf8');

// Replace gemini-3.5-flash with gemini-1.5-flash to bypass the 20-req/day limit
code = code.replace(/model: 'gemini-3.5-flash'/g, "model: 'gemini-1.5-flash'");

fs.writeFileSync(file, code, 'utf8');
console.log('Switched model to gemini-1.5-flash');
