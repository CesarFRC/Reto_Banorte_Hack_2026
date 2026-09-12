import { z } from 'zod';
import { Type } from '@google/genai';

// ═══════════════════════════════════════════════════════════
// A2UI PROTOCOL SCHEMA
// Agent-to-UI structured output specification
// ═══════════════════════════════════════════════════════════

/**
 * All possible UI components the agent can render.
 * Each component maps to a React/React Native component on the frontend.
 */
export const A2UI_COMPONENTS = [
  'BurnerCard',
  'FraudAlertView',
  'SubscriptionManager',
  'PayrollAdvance',
  'ResolutionSuccessCard',
] as const;

export type A2UIComponentName = (typeof A2UI_COMPONENTS)[number];

/**
 * The core A2UI message schema.
 * Every response from the agent MUST conform to this shape.
 */
export const A2UIMessageSchema = z.object({
  speechText: z
    .string()
    .describe(
      'Texto corto, empático y sereno para síntesis de voz con ElevenLabs. Máximo 2-3 oraciones. Sin emojis ni caracteres especiales.'
    ),
  component: z
    .enum(A2UI_COMPONENTS)
    .describe(
      'Nombre del componente React a renderizar en el frontend. BurnerCard=tarjeta virtual, FraudAlertView=alerta de fraude, SubscriptionManager=gestor de suscripciones, PayrollAdvance=adelanto de nómina, ResolutionSuccessCard=confirmación de acción exitosa.'
    ),
  props: z
    .record(z.any())
    .describe(
      'Propiedades dinámicas para inyectar en el componente React. Deben incluir todos los datos necesarios para renderizar la UI.'
    ),
  availableActions: z
    .array(z.string())
    .describe(
      'Lista de acciones que el usuario puede disparar desde esta UI. Cada acción es un string descriptivo que el frontend convierte en botones o interacciones.'
    ),
});

export type A2UIMessage = z.infer<typeof A2UIMessageSchema>;

/**
 * Gemini-compatible response schema for structured output.
 * Used in the `generationConfig.responseSchema` parameter.
 */
export const A2UI_GEMINI_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    speechText: {
      type: Type.STRING,
      description:
        'Texto corto, empático y sereno para síntesis de voz. Máximo 2-3 oraciones. Sin emojis.',
    },
    component: {
      type: Type.STRING,
      description: 'Nombre del componente React a renderizar.',
      enum: [...A2UI_COMPONENTS],
    },
    props: {
      type: Type.OBJECT,
      description:
        'Propiedades dinámicas para el componente. Incluye todos los datos necesarios.',
      properties: {},
    },
    availableActions: {
      type: Type.ARRAY,
      description:
        'Acciones disponibles para el usuario desde esta UI.',
      items: { type: Type.STRING },
    },
  },
  required: ['speechText', 'component', 'props', 'availableActions'],
};
