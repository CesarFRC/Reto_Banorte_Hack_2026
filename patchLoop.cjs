const fs = require('fs');
const file = 'src/orchestrator/agent.ts';
let code = fs.readFileSync(file, 'utf8');

// Add maxOutputTokens and temperature to avoid loops
code = code.replace(
  /systemInstruction: SYSTEM_PROMPT,/g,
  `systemInstruction: SYSTEM_PROMPT,
        temperature: 0.2,
        maxOutputTokens: 1024,`
);

// Add rule to system prompt to prevent looping
code = code.replace(
  /Siempre responde en espaol mexicano\. SǸ cǭlida pero profesional\./,
  `Siempre responde en espanol mexicano. Se calida pero profesional. REGLA ESTRICTA DE VOZ: Tu campo "speechText" DEBE ser extremadamente corto (maximo 2 oraciones). NUNCA repitas palabras ni frases largas.`
);

fs.writeFileSync(file, code, 'utf8');
console.log('Patched agent.ts with maxOutputTokens, temperature, and speechText limit');
