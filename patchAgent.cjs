const fs = require('fs');
const file = 'src/orchestrator/agent.ts';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('DynamicBankView')) {
  code = code.replace(
    /- ResolutionSuccessCard.*?\)/,
    `$&
- DynamicBankView: (NUEVO/DINAMICO) Usa este componente MAGICO para cualquier consulta general, analisis de gastos, resumen de cuentas, graficas, consejos o recibos que no encajen en las tarjetas especificas. Puedes armar la UI como si fueran bloques de lego usando el array "elements" (header, text, key_value, bar_chart, action_button). Sientete libre de inventar graficas y layouts.`
  );
  fs.writeFileSync(file, code, 'utf8');
  console.log('Updated agent.ts with DynamicBankView prompt.');
}
