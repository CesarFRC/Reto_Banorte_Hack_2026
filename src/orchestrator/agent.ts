import Groq from 'groq-sdk';
import { env, hasGroqKey } from '../config/env.js';
import { mcpRegistry } from '../mcp/registry.js';
import { A2UIMessageSchema, A2UI_JSON_SCHEMA } from './a2ui-schema.js';
import type { A2UIMessage } from './a2ui-schema.js';

// ─── Types ──────────────────────────────────────────────
export interface ConversationTurn {
  role: 'user' | 'model' | 'assistant';
  parts?: Array<{ text: string }>;
  content?: string;
}

export interface AgentInput {
  message: string;
  userId: string;
  conversationHistory: ConversationTurn[];
  actionContext?: {
    action: string;
    payload: Record<string, any>;
  };
}

export interface AgentOutput {
  a2ui: A2UIMessage;
  toolsUsed: string[];
}

// ─── System Prompt ──────────────────────────────────────
const SYSTEM_PROMPT = `Eres Maya, la asistente financiera inteligente de Banorte. Tu personalidad es empática, serena, profesional y resolutiva.

REGLAS ABSOLUTAS:
1. NUNCA respondas con texto largo o explicaciones extensas. Tu respuesta SIEMPRE es un componente visual interactivo.
2. Analiza la intención financiera del usuario y usa las herramientas MCP disponibles para resolver su necesidad.
3. En "speechText", escribe máximo 2-3 oraciones cortas y empáticas. Este texto se convierte en audio. No uses emojis ni caracteres especiales.
4. En "component", elige el componente más apropiado para la situación.
5. En "props", incluye TODOS los datos retornados por las herramientas para que el frontend los renderice.
6. En "availableActions", ofrece entre 3 y 4 opciones concretas y accionables que el usuario puede elegir (ej. "Ver movimientos del mes", "Crear tarjeta SafeCart", "Revisar suscripciones", "Adelanto de nómina").

COMPONENTES DISPONIBLES:
- DynamicBankView: (PRINCIPAL Y DINÁMICO) ÚSALO SIEMPRE PARA SALUDOS ("Hola", "Buen día", "INIT_SESSION_SILENT"), consultas generales, análisis, resumen de cuentas, gráficas y cálculos. REGLA ESTRICTA: PROHIBIDO USAR MARKDOWN (**, ###). Debes fragmentar la información usando múltiples "elements" (header, text, key_value, bar_chart, action_button). SI TE PIDEN UNA GRÁFICA, ES OBLIGATORIO INCLUIR UN ELEMENTO "bar_chart" con "data". Usa "key_value" para listas o datos importantes. NUNCA regreses un solo bloque de "text" gigante. Puedes armar la UI como si fueran bloques de lego usando el array "elements" (header, text, key_value, bar_chart, action_button). Siéntete libre de inventar gráficas y layouts dinámicos.
- BurnerCard: SOLO para crear/mostrar/destruir tarjetas virtuales desechables (SafeCart) cuando el usuario lo pida específicamente. ¡ESTÁ ESTRICTAMENTE PROHIBIDO USARLO ANTE UN SALUDO O MENSAJE GENERAL!
- FraudAlertView: Úsalo SOLO cuando el usuario pregunte por cargos sospechosos, reportar fraudes o congelar tarjetas.
- SubscriptionManager: Para listar suscripciones activas y cancelar las que el usuario elija.
- PayrollAdvance: Para mostrar elegibilidad de adelanto de nómina y dispersar fondos.
- ResolutionSuccessCard: Para confirmar que una acción se completó exitosamente (tarjeta destruida, disputa registrada, suscripción cancelada, adelanto dispersado).

REGLA DE ORO PARA SALUDOS Y BIENVENIDAS:
- Si el usuario saluda (ej. "Hola", "Buen día", "Qué hay", "Hola Maya") o envía "INIT_SESSION_SILENT":
  DEBES responder OBLIGATORIAMENTE con DynamicBankView.
  - En "speechText": Da un saludo cálido y natural (ej. "¡Hola Daniel! Qué gusto saludarte. ¿Qué operación bancaria realizaremos hoy?" o "¡Hola Carlos! Bienvenido al asistente financiero de Banorte. Tienes tu cuenta al día, ¿en qué te puedo apoyar hoy?").
  - En "props": Pon "title": "Resumen Financiero", "subtitle": "Cuenta Banorte Platinum", y en "elements" muestra un resumen visual atractivo: un header, 2 o 3 key_value (ej. Saldo disponible, Puntos Banorte, Próximo corte), y un bar_chart o text breve.
  - En "availableActions": Ofrece opciones variadas y llamativas para que el usuario elija con un solo tap (ej. ["Ver movimientos del mes", "Crear tarjeta SafeCart", "Mis suscripciones activas", "Consultar adelanto de nómina"]).
  - ¡BAJO NINGUNA CIRCUNSTANCIA uses BurnerCard para saludar!

CONTEXTO DEL USUARIO:
- Nombre: Daniel (o Carlos Mendoza García)
- Cuenta Banorte Platinum
- Sueldo mensual: $45,000 MXN
- Usuario ID: usr_banorte_demo

Siempre responde en español mexicano. Sé cálida pero profesional.

REGLAS DE FORMATO:
- USO DE COMPONENTES:
  - Si el usuario quiere ver, gestionar o cancelar sus suscripciones (ej. "Mis suscripciones activas", "Quiero cancelar"), USA SIEMPRE "SubscriptionManager" para mostrar los logos oficiales.
  - Si el usuario hace preguntas de proyección matemática o análisis (ej. "¿Cuánto gastaré en 2 meses?", "¿Cuál es mi saldo disponible?"), USA "DynamicBankView" con 'elements' (header, text, key_value, bar_chart) para generar una UI analítica.
- Las fechas en el JSON siempre deben tener formato DD/MM/YYYY HH:mm (ej. 12/09/2026 15:30). ¡Nunca uses ISO 8601 ni la letra T/Z!
- En los elementos de DynamicBankView, usa siempre el campo "content" (NO "text", NO "title") para el texto de header y text. Para key_value usa "label" y "value". Para bar_chart usa "data".
- Mantén entre 3 y 5 elements por DynamicBankView para no exceder el límite de tokens.

RESPUESTA OBLIGATORIA: JSON puro con exactamente estas claves: speechText (string), component (uno de los listados arriba), props (objeto con datos), availableActions (array de strings). SIN texto extra, SIN markdown, SOLO el JSON.`;

// ─── JSON Auto-Repair ───────────────────────────────────────
function repairJson(raw: string): string {
  // Remove common model preambles (```json or similar)
  let s = raw.trim().replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

  // Try to parse as-is first
  try { JSON.parse(s); return s; } catch {}

  // Count open/close brackets to close unclosed ones
  const openCurlies = (s.match(/{/g) || []).length;
  const closeCurlies = (s.match(/}/g) || []).length;
  const openSquares = (s.match(/\[/g) || []).length;
  const closeSquares = (s.match(/]/g) || []).length;

  // If the string ends mid-value, truncate at last complete key-value pair
  // Remove trailing incomplete segment: ,"key": "incomplete...
  s = s.replace(/,\s*"[^"]*"\s*:\s*"[^"]*$/, '');
  s = s.replace(/,\s*"[^"]*"\s*:\s*[^,}\]]*$/, '');
  s = s.replace(/,\s*"[^"]*"\s*$/, '');
  s = s.replace(/,\s*\{[^}]*$/, '');

  // Close open arrays then objects
  for (let i = 0; i < openSquares - closeSquares; i++) s += ']';
  for (let i = 0; i < openCurlies - closeCurlies; i++) s += '}';

  return s;
}

// ─── Mock Response (when no API key) ────────────────────
function createMockResponse(message: string): A2UIMessage {
  const lower = message.toLowerCase();

  if (lower.includes('tarjeta virtual') || lower.includes('safecart') || lower.includes('desechable')) {
    return {
      speechText: 'Voy a crear una tarjeta virtual segura para tu compra. Dime el monto límite que necesitas.',
      component: 'BurnerCard',
      props: {
        status: 'prompt',
        message: 'Para crear tu tarjeta SafeCart, necesito saber el límite de gasto.',
        suggestedLimits: [500, 1000, 2500, 5000],
      },
      availableActions: ['Crear tarjeta de $500', 'Crear tarjeta de $1,000', 'Crear tarjeta de $2,500', 'Definir otro monto'],
    };
  }

  return {
    speechText: '¡Hola Daniel! Bienvenido a Maya de Banorte. Tu cuenta Platinum está al día, ¿en qué te puedo apoyar hoy?',
    component: 'DynamicBankView',
    props: {
      title: 'Resumen Financiero',
      subtitle: 'Cuenta Banorte Platinum',
      elements: [
        { type: 'header', content: 'Estado de Cuenta' },
        { type: 'key_value', label: 'Saldo Débito Disponible', value: '$45,280.00 MXN' },
        { type: 'key_value', label: 'Puntos Recompensa', value: '14,250 pts' },
        { type: 'text', content: 'Tienes tu nómina disponible para adelanto y 1 suscripción activa.' }
      ]
    },
    availableActions: [
      'Ver movimientos recientes',
      'Crear tarjeta SafeCart',
      'Gestionar suscripciones',
      'Solicitar adelanto de nómina'
    ],
  };
}

// ─── Main Agent Function ────────────────────────────────
export async function runAgent(input: AgentInput): Promise<AgentOutput> {
  const toolsUsed: string[] = [];

  // ── Build user message ────────────────────────────────
  let userMessage = input.message;
  if (input.actionContext) {
    userMessage = `[ACCIÓN DEL USUARIO] El usuario ejecutó la acción "${input.actionContext.action}" con los siguientes datos: ${JSON.stringify(input.actionContext.payload)}. Genera la UI apropiada para mostrar el resultado.`;
  }

  // ── If no Groq API key, use mock ──────────────────────
  if (!hasGroqKey) {
    console.log('⚠️  No GROQ_API_KEY — using mock response');
    return {
      a2ui: createMockResponse(userMessage),
      toolsUsed,
    };
  }

  // ── Initialize Groq ───────────────────────────────────
  const groq = new Groq({ apiKey: env.GROQ_API_KEY });

  // ── Build conversation history ────────────────────────
  const messages: any[] = [
    { role: 'system', content: SYSTEM_PROMPT }
  ];

  for (const turn of input.conversationHistory) {
    const role = turn.role === 'model' ? 'assistant' : 'user';
    const content = turn.parts ? turn.parts.map(p => p.text).join(' ') : turn.content || '';
    if (content) {
      messages.push({ role, content });
    }
  }

  messages.push({ role: 'user', content: userMessage });

  const tools = mcpRegistry.toGroqTools();

  let response;
  let maxIterations = 5;

  while (maxIterations > 0) {
    // ── Call Groq ───────────────────────────────────────
    response = await groq.chat.completions.create({
      model: 'qwen/qwen3.8-27b',
      messages,
      tools: tools.length > 0 ? tools : undefined,
      temperature: 0.2,
      max_tokens: 900,
    });

    const choice = response.choices[0];
    const message = choice.message;

    // Check if Groq wants to call tools
    if (message.tool_calls && message.tool_calls.length > 0) {
      // Append assistant's tool calls to history
      messages.push(message);

      // Execute each tool
      for (const tc of message.tool_calls) {
        console.log(`  🔧 Tool call: ${tc.function.name}(${tc.function.arguments})`);
        let args = {};
        try { args = JSON.parse(tc.function.arguments); } catch(e) {}
        
        const result = await mcpRegistry.execute(tc.function.name, args);
        toolsUsed.push(tc.function.name);

        // Append tool result to history
        messages.push({
          role: 'tool',
          tool_call_id: tc.id,
          name: tc.function.name,
          content: JSON.stringify(result.success ? result.result : { error: result.error })
        });
      }
      
      maxIterations--;
      continue;
    }

    // No tool calls, break loop
    break;
  }

  // ── Extract and validate A2UI response ────────────────────────
  const rawContent = response?.choices[0]?.message?.content || '{}';
  const finalContent = repairJson(rawContent);

  try {
    const parsed = JSON.parse(finalContent);
    const validated = A2UIMessageSchema.parse(parsed);

    return {
      a2ui: validated,
      toolsUsed,
    };
  } catch (err: any) {
    console.error('❌ Failed to parse A2UI response:', err.message);
    console.error('Raw response:', rawContent);

    return {
      a2ui: createMockResponse(userMessage),
      toolsUsed,
    };
  }
}
