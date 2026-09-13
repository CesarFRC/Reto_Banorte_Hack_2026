const fs = require('fs');
const file = 'src/orchestrator/agent.ts';
let code = fs.readFileSync(file, 'utf8');

const regex = /- Mantén los elementos mínimos y concisos: máximo 5 elements por DynamicBankView para no exceder el limite de tokens\./;
const replacement = `- Mantén los elementos mínimos y concisos: máximo 5 elements por DynamicBankView para no exceder el limite de tokens.
- SI EL USUARIO DICE EXACTAMENTE "INIT_SESSION_SILENT": Significa que acaba de abrir la aplicación. DEBES responder OBLIGATORIAMENTE con un \`DynamicBankView\` que sirva como pantalla de inicio (Dashboard). Dependiendo de tu razonamiento sobre la hora o el contexto, genera gráficas, resumen de saldo, o últimos movimientos. Da la bienvenida de forma corta en el \`speechText\` (ej. "¡Hola Carlos! Bienvenido a Maya, ¿qué haremos hoy?").`;

if(regex.test(code)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync(file, code, 'utf8');
    console.log("Agent updated successfully");
} else {
    console.log("Regex not found again...");
}
