import { GoogleGenAI } from '@google/genai';
import { env, hasGeminiKey } from '../config/env.js';
import { mcpRegistry } from '../mcp/registry.js';
import { A2UIMessageSchema, A2UI_GEMINI_SCHEMA } from './a2ui-schema.js';
import type { A2UIMessage } from './a2ui-schema.js';

// ─── Types ──────────────────────────────────────────────
export interface ConversationTurn {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
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
- ResolutionSuccessCard: Para confirmar que una acción se completó exitosamente (tarjeta destruida, disputa registrada, suscripción cancelada, adelanto dispersado).

CONTEXTO DEL USUARIO:
- Nombre: Carlos Mendoza García
- Cuenta Banorte Platinum
- Sueldo mensual: $45,000 MXN
- Usuario ID: usr_banorte_demo

Siempre responde en español mexicano. Sé cálida pero profesional.`;

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

  if (lower.includes('fraude') || lower.includes('cargo') || lower.includes('no reconozco') || lower.includes('sospechoso')) {
    return {
      speechText: 'Entiendo tu preocupación. Voy a revisar tus transacciones recientes para identificar cualquier actividad sospechosa.',
      component: 'FraudAlertView',
      props: {
        status: 'scanning',
        message: 'Analizando tus transacciones recientes...',
      },
      availableActions: ['review_transactions', 'freeze_card', 'file_dispute'],
    };
  }

  if (lower.includes('suscripci') || lower.includes('netflix') || lower.includes('spotify') || lower.includes('cobro recurrente')) {
    return {
      speechText: 'Voy a revisar todas tus suscripciones activas para que decidas cuáles conservar.',
      component: 'SubscriptionManager',
      props: {
        status: 'loading',
        message: 'Cargando tus suscripciones...',
      },
      availableActions: ['view_subscriptions', 'cancel_selected'],
    };
  }

  if (lower.includes('adelanto') || lower.includes('nómina') || lower.includes('préstamo') || lower.includes('dinero')) {
    return {
      speechText: 'Voy a verificar tu elegibilidad para un adelanto de nómina. Dame un momento.',
      component: 'PayrollAdvance',
      props: {
        status: 'checking',
        message: 'Verificando tu elegibilidad...',
      },
      availableActions: ['check_eligibility', 'request_advance'],
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

  // ── If no Gemini API key, use mock ────────────────────
  if (!hasGeminiKey) {
    console.log('⚠️  No Gemini API key — using mock response');
    return {
      a2ui: createMockResponse(userMessage),
      toolsUsed,
    };
  }

  // ── Initialize Gemini ─────────────────────────────────
  const genai = new GoogleGenAI({ apiKey: env.GOOGLE_GENAI_API_KEY });

  // ── Build conversation history ────────────────────────
  const contents: ConversationTurn[] = [
    ...input.conversationHistory,
    { role: 'user', parts: [{ text: userMessage }] },
  ];

  // ── First call: Let Gemini decide if it needs tools ───
  const toolsConfig = mcpRegistry.toGeminiTools();

  let response = await genai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      tools: [toolsConfig],
    },
  });

  // ── Tool calling loop ─────────────────────────────────
  // If Gemini requests tool calls, execute them and feed results back
  let maxIterations = 5; // Safety limit
  while (maxIterations > 0) {
    const candidate = response.candidates?.[0];
    if (!candidate?.content?.parts) break;

    const functionCalls = candidate.content.parts.filter(
      (p: any) => p.functionCall
    );

    if (functionCalls.length === 0) break;

    // Execute each function call
    const functionResponses: any[] = [];

    for (const part of functionCalls) {
      const fc = (part as any).functionCall;
      console.log(`  🔧 Tool call: ${fc.name}(${JSON.stringify(fc.args)})`);

      const result = await mcpRegistry.execute(fc.name, fc.args || {});
      toolsUsed.push(fc.name);

      functionResponses.push({
        functionResponse: {
          name: fc.name,
          response: result.success
            ? result.result
            : { error: result.error },
        },
      });
    }

    // Add model's function call response and our function results to history
    contents.push({
      role: 'model',
      parts: candidate.content.parts as any,
    });
    contents.push({
      role: 'user',
      parts: functionResponses as any,
    });

    // Call Gemini again with tool results + structured output
    response = await genai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        tools: [toolsConfig],
        responseMimeType: 'application/json',
        responseSchema: A2UI_GEMINI_SCHEMA as any,
      },
    });

    maxIterations--;
  }

  // ── Extract and validate A2UI response ────────────────
  const candidate = response.candidates?.[0];
  const textPart = candidate?.content?.parts?.find((p: any) => p.text);

  if (!textPart || !(textPart as any).text) {
    console.error('❌ No text response from Gemini');
    return {
      a2ui: createMockResponse(userMessage),
      toolsUsed,
    };
  }

  try {
    const parsed = JSON.parse((textPart as any).text);
    const validated = A2UIMessageSchema.parse(parsed);

    return {
      a2ui: validated,
      toolsUsed,
    };
  } catch (err: any) {
    console.error('❌ Failed to parse A2UI response:', err.message);
    console.error('Raw response:', (textPart as any).text);

    return {
      a2ui: createMockResponse(userMessage),
      toolsUsed,
    };
  }
}
