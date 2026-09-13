const fs = require('fs');
const file = 'src/orchestrator/agent.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/`DynamicBankView`/g, "'DynamicBankView'");
code = code.replace(/`speechText`/g, "'speechText'");

fs.writeFileSync(file, code, 'utf8');
console.log('Fixed syntax error in agent.ts');
