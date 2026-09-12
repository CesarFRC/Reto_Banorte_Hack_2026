const fs = require('fs');
const file = 'src/orchestrator/agent.ts';
let code = fs.readFileSync(file, 'utf8');

// Replace model name
code = code.replace(/gemini-3\.5-flash-lite/g, 'gemini-3.5-flash');

// Add JSON constraint to the first call
if (!code.includes("responseSchema: A2UI_GEMINI_SCHEMA as any,")) {
  console.log("Schema enforcement missing. Adding...");
}

code = code.replace(
  /tools: \[toolsConfig\],\n    \},/g,
  `tools: [toolsConfig],
      responseMimeType: 'application/json',
      responseSchema: A2UI_GEMINI_SCHEMA as any,
    },`
);

fs.writeFileSync(file, code, 'utf8');
console.log('Fixed agent.ts model and json config');
