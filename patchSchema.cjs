const fs = require('fs');
const file = 'src/orchestrator/a2ui-schema.ts';
let code = fs.readFileSync(file, 'utf8');

if (code.includes('availableActions: z\n    .array(z.string())')) {
  code = code.replace(
    /availableActions: z\n    \.array\(z\.string\(\)\)/,
    'availableActions: z.array(z.any())'
  );
  fs.writeFileSync(file, code, 'utf8');
  console.log('Patched availableActions in a2ui-schema.ts (zod)');
} else if (code.includes('availableActions: z.array(z.string())')) {
  code = code.replace(
    /availableActions: z\.array\(z\.string\(\)\)/,
    'availableActions: z.array(z.any())'
  );
  fs.writeFileSync(file, code, 'utf8');
  console.log('Patched availableActions in a2ui-schema.ts (zod - inline)');
} else {
  console.log('Could not find availableActions: z.array(z.string())');
}

// Also update the Gemini schema definition for availableActions to allow objects
if (code.includes('availableActions: {\n      type: Type.ARRAY,\n      description:\n        \'Acciones disponibles para el usuario desde esta UI.\',\n      items: { type: Type.STRING },\n    }')) {
  code = code.replace(
    /items: \{ type: Type\.STRING \}/,
    'items: { type: Type.OBJECT }' // Or omit items, but let's change to OBJECT so it matches what Gemini tries to do
  );
  fs.writeFileSync(file, code, 'utf8');
  console.log('Patched availableActions in Gemini schema');
}
