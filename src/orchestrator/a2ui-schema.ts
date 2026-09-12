import { z } from 'zod';
import { Type } from '@google/genai';

export const A2UI_COMPONENTS = [
  'BurnerCard',
  'FraudAlertView',
  'SubscriptionManager',
  'PayrollAdvance',
  'ResolutionSuccessCard',
] as const;

export type A2UIComponentName = (typeof A2UI_COMPONENTS)[number];

export const A2UIMessageSchema = z.object({
  speechText: z
    .string()
    .describe(
      'Texto corto, empático y sereno para síntesis de voz con ElevenLabs. Máximo 2-3 oraciones. Sin emojis ni caracteres especiales.'
    ),
  component: z
    .enum(A2UI_COMPONENTS)
    .describe(
      'Nombre del componente React a renderizar en el frontend.'
    ),
  props: z
    .record(z.any())
    .describe(
      'Propiedades dinámicas para inyectar en el componente React.'
    ),
  availableActions: z
    .array(z.string())
    .describe(
      'Lista de acciones que el usuario puede disparar desde esta UI.'
    ),
});

export type A2UIMessage = z.infer<typeof A2UIMessageSchema>;

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
        'Propiedades dinámicas del componente visual con todos sus datos.',
      properties: {
        cardNumber: { type: Type.STRING, description: '16 digitos de la tarjeta' },
        cardHolder: { type: Type.STRING, description: 'Nombre del titular' },
        expiryDate: { type: Type.STRING, description: 'Fecha de vencimiento MM/YY' },
        cvv: { type: Type.STRING, description: 'CVV dinámico de 3 dígitos' },
        spendingLimit: { type: Type.NUMBER, description: 'Límite de gasto en MXN' },
        remainingSeconds: { type: Type.NUMBER, description: 'Segundos restantes de vida' },
        brand: { type: Type.STRING, description: 'visa o mastercard' },

        cardInfo: { type: Type.OBJECT, description: 'Información de la tarjeta con id, lastFour, type, isFrozen' },
        suspiciousTransaction: { type: Type.OBJECT, description: 'Transacción sospechosa' },
        recentTransactions: { type: Type.ARRAY, items: { type: Type.OBJECT }, description: 'Lista de transacciones recientes' },
        plasticEnabled: { type: Type.BOOLEAN, description: 'Estado del plástico físico' },

        subscriptions: { type: Type.ARRAY, items: { type: Type.OBJECT }, description: 'Lista de suscripciones activas' },
        totalMonthlySpend: { type: Type.NUMBER, description: 'Gasto total mensual' },

        maxAmount: { type: Type.NUMBER, description: 'Monto máximo de nómina' },
        minAmount: { type: Type.NUMBER, description: 'Monto mínimo' },
        defaultAmount: { type: Type.NUMBER, description: 'Monto preseleccionado' },
        disbursementDate: { type: Type.STRING, description: 'Fecha estimada de dispersión' },
        installmentOptions: { type: Type.ARRAY, items: { type: Type.OBJECT }, description: 'Opciones de quincenas' },
        employerName: { type: Type.STRING, description: 'Empresa empleadora' },

        title: { type: Type.STRING, description: 'Título de confirmación' },
        description: { type: Type.STRING, description: 'Descripción de confirmación' },
        details: { type: Type.ARRAY, items: { type: Type.OBJECT }, description: 'Detalles clave-valor' },
        folio: { type: Type.STRING, description: 'Folio de operación' },
        type: { type: Type.STRING, description: 'payment | card | subscription | dispute | advance' },
      },
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
