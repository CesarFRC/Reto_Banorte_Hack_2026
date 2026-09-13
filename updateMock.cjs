const fs = require('fs');
const file = 'src/orchestrator/agent.ts';
let code = fs.readFileSync(file, 'utf8');

const regex = /return \{\s*speechText: 'Hola Carlos, soy Maya, tu asistente financiera\. ¿En qué puedo ayudarte hoy\?',\s*component: 'BurnerCard',/s;
const replacement = `if (message === 'INIT_SESSION_SILENT') {
    return {
      speechText: '¡Hola Daniel! Bienvenido a Maya, tu asistente financiero.',
      component: 'DynamicBankView',
      props: {
        elements: [
          { type: 'header', content: 'Resumen del Día' },
          { type: 'text', content: 'Tu saldo actual es de $45,000 MXN.' }
        ]
      },
      availableActions: []
    };
  }
  
  return {
      speechText: 'Hola Carlos, soy Maya, tu asistente financiera. ¿En qué puedo ayudarte hoy?',
      component: 'DynamicBankView',
      props: { elements: [{type: 'text', content: 'No reconozco ese comando (Modo Mock Activo).'}] },`;

code = code.replace(regex, replacement);
fs.writeFileSync(file, code, 'utf8');
console.log('Mock fallback updated for INIT_SESSION_SILENT');
