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
1. NUNCA respondas con texto largo o explicaciones extensas. Tu respuesta SIEMPRE es un componente visual.
2. Analiza la intención financiera del usuario y usa las herramientas MCP disponibles para resolver su necesidad.
3. En "speechText", escribe máximo 2-3 oraciones cortas y empáticas. Este texto se convierte en audio. No uses emojis ni caracteres especiales.
4. En "component", elige el componente más apropiado para la situación.
5. En "props", incluye TODOS los datos retornados por las herramientas para que el frontend los renderice.
6. En "availableActions", ofrece acciones concretas y relevantes que el usuario puede tomar desde la UI.

COMPONENTES DISPONIBLES:
- BurnerCard: Para crear/mostrar/destruir tarjetas virtuales desechables (SafeCart).
- FraudAlertView: Para mostrar transacciones sospechosas, congelar tarjetas y disputar cargos.
- SubscriptionManager: Para listar suscripciones activas y cancelar las que el usuario elija.
- PayrollAdvance: Para mostrar elegibilidad de adelanto de nómina y dispersar fondos.
- ResolutionSuccessCard: Para confirmar que una acción se completó exitosamente (tarjeta destruida, disputa registrada, suscripción cancelada, adelanto dispersado)
- DynamicBankView: (NUEVO/DINAMICO) EL COMPONENTE MAS IMPORTANTE. Usalo para consultas generales, analisis, resumen de cuentas, graficas y calculos. REGLA ESTRICTA: PROHIBIDO USAR MARKDOWN (**, ###). Debes fragmentar la informacion usando multiples "elements". SI TE PIDEN UNA GRAFICA, ES OBLIGATORIO INCLUIR UN ELEMENTO "bar_chart" con "data". Usa "key_value" para listas o datos importantes. NUNCA regreses un solo bloque de "text" gigante. Puedes armar la UI como si fueran bloques de lego usando el array "elements" (header, text, key_value, bar_chart, action_button). Sientete libre de inventar graficas y layouts..

CONTEXTO DEL USUARIO:
- Nombre: Carlos Mendoza García
- Cuenta Banorte Platinum
- Sueldo mensual: $45,000 MXN
- Usuario ID: usr_banorte_demo

Siempre responde en español mexicano. Se calida pero profesional.

REGLAS DE FORMATO:
- Las fechas en el JSON siempre deben tener formato DD/MM/YYYY HH:mm (ej. 12/09/2026 15:30). ¡Nunca uses ISO 8601 ni la letra T/Z!
- Si no conoces un dato, déjalo vacío o usa datos del contexto.

RESPUESTA OBLIGATORIA: JSON puro con exactamente estas claves: speechText (string), component (uno de los listados arriba), props (objeto con datos de la herramienta), availableActions (array de strings). SIN texto extra, SIN markdown, SOLO el JSON.`;

// ─── Mock Response (when no API key) ────────────────────
function createMockResponse(message: string): A2UIMessage {
  const lower = message.toLowerCase();

  if (lower.includes('tarjeta virtual') || lower.includes('safecart') || lower.includes('comprar')) {
    return {
      speechText: 'Voy a crear una tarjeta virtual segura para tu compra. Dime el monto límite que necesitas.',
      component: 'BurnerCard',
      props: {
        status: 'prompt',
        message: 'Para crear tu tarjeta SafeCart, necesito saber el límite de gasto.',
        suggestedLimits: [500, 1000, 2500, 5000],
      },
      availableActions: ['create_card_500', 'create_card_1000', 'create_card_2500', 'create_card_custom'],
    };
  }

  return {
    speechText: 'Hola Carlos, soy Maya, tu asistente financiera. ¿En qué puedo ayudarte hoy?',
    component: 'BurnerCard',
    props: {
      status: 'welcome',
      message: 'Puedo ayudarte con tarjetas virtuales, fraude, suscripciones o adelanto de nómina.',
    },
    availableActions: ['create_virtual_card', 'check_fraud', 'manage_subscriptions', 'payroll_advance'],
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
      max_tokens: 700,
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

  // ── Extract and validate A2UI response ────────────────
  const finalContent = response?.choices[0]?.message?.content || '{}';

  try {
    const parsed = JSON.parse(finalContent);
    const validated = A2UIMessageSchema.parse(parsed);

    return {
      a2ui: validated,
      toolsUsed,
    };
  } catch (err: any) {
    console.error('❌ Failed to parse A2UI response:', err.message);
    console.error('Raw response:', finalContent);

    return {
      a2ui: createMockResponse(userMessage),
      toolsUsed,
    };
  }
}
