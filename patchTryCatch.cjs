const fs = require('fs');
const file = 'src/orchestrator/agent.ts';
let code = fs.readFileSync(file, 'utf8');

// Replace the first generateContent with a try/catch
const search1 = `  let response = await genai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      tools: [toolsConfig],
    },
  });`;

const replace1 = `  let response;
  try {
    response = await genai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        tools: [toolsConfig],
      },
    });
  } catch (err: any) {
    console.error('❌ Gemini API Error:', err.message);
    return {
      a2ui: createMockResponse(userMessage),
      toolsUsed: [],
    };
  }`;

code = code.replace(search1, replace1);

// Replace the inner loop generateContent with try/catch
const search2 = `    // Call Gemini again with tool results + structured output
    response = await genai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        tools: [toolsConfig],
        responseMimeType: 'application/json',
        responseSchema: A2UI_GEMINI_SCHEMA as any,
      },
    });`;

const replace2 = `    // Call Gemini again with tool results + structured output
    try {
      response = await genai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          tools: [toolsConfig],
          responseMimeType: 'application/json',
          responseSchema: A2UI_GEMINI_SCHEMA as any,
        },
      });
    } catch (err: any) {
      console.error('❌ Gemini API Error in loop:', err.message);
      return {
        a2ui: createMockResponse(userMessage),
        toolsUsed,
      };
    }`;

code = code.replace(search2, replace2);

fs.writeFileSync(file, code, 'utf8');
console.log('Patched agent.ts with try/catch for genai calls');
