const fs = require('fs');
const file = 'src/orchestrator/agent.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /let response;\s*try {\s*response = await genai\.models\.generateContent\({/s,
  `let response;\n  try {\n    console.log('⏳ [1/2] Llamando a Gemini API (Procesamiento de Intención)...');\n    const startTime = Date.now();\n    response = await genai.models.generateContent({`
);

code = code.replace(
  /      },\n    }\);\n  \} catch \(err: any\) \{/,
  `      },\n    });\n    console.log(\`✅ [1/2] Gemini respondió en \${Date.now() - startTime}ms\`);\n  } catch (err: any) {`
);

code = code.replace(
  /    \/\/ If Gemini requests tool calls, execute them and feed results back/g,
  `    console.log('🔧 Herramientas invocadas por Gemini:', functionCalls.map(f => f.name));\n    // If Gemini requests tool calls, execute them and feed results back`
);

code = code.replace(
  /      \/\/ Call Gemini again with tool results \+ structured output\s*try \{\s*response = await genai\.models\.generateContent\(\{/s,
  `      // Call Gemini again with tool results + structured output\n      try {\n        console.log('⏳ [2/2] Llamando a Gemini API (Renderizado A2UI JSON)...');\n        const t2 = Date.now();\n        response = await genai.models.generateContent({`
);

code = code.replace(
  /          responseSchema: A2UI_GEMINI_SCHEMA as any,\n        \},\n      \}\);\n    \} catch \(err: any\) \{/s,
  `          responseSchema: A2UI_GEMINI_SCHEMA as any,\n        },\n      });\n        console.log(\`✅ [2/2] Gemini JSON generado en \${Date.now() - t2}ms\`);\n    } catch (err: any) {`
);

fs.writeFileSync(file, code, 'utf8');
console.log('Logs added successfully');
