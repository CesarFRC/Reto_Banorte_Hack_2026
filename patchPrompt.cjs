const fs = require('fs');
const file = 'src/orchestrator/agent.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /- DynamicBankView.*?\./,
  `- DynamicBankView: (NUEVO/DINAMICO) EL COMPONENTE MAS IMPORTANTE. Usalo para consultas generales, analisis, resumen de cuentas, graficas y calculos. REGLA ESTRICTA: PROHIBIDO USAR MARKDOWN (**, ###). Debes fragmentar la informacion usando multiples "elements". SI TE PIDEN UNA GRAFICA, ES OBLIGATORIO INCLUIR UN ELEMENTO "bar_chart" con "data". Usa "key_value" para listas o datos importantes. NUNCA regreses un solo bloque de "text" gigante.`
);

fs.writeFileSync(file, code, 'utf8');
console.log('Updated agent.ts prompt with strict A2UI rules.');
