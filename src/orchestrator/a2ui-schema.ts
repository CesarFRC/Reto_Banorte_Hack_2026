import { z } from 'zod';
import { Type } from '@google/genai';

export const A2UI_COMPONENTS = [
  'BurnerCard',
  'FraudAlertView',
  'SubscriptionManager',
  'PayrollAdvance',
  'ResolutionSuccessCard',
  'DynamicBankView',
] as const;

export type A2UIComponentName = (typeof A2UI_COMPONENTS)[number];

export const A2UIMessageSchema = z.object({
  speechText: z
    .string()
    .describe(
      'Texto corto, empatico y sereno para sintesis de voz con ElevenLabs. Maximo 2-3 oraciones. Sin emojis ni caracteres especiales.'
    ),
  component: z
    .enum(A2UI_COMPONENTS)
    .describe(
      'Nombre del componente React a renderizar en el frontend.'
    ),
  props: z
    .record(z.any())
    .describe(
      'Propiedades dinamicas para inyectar en el componente React.'
    ),
  availableActions: z.array(z.any())
    .describe(
      'Lista de acciones que el usuario puede disparar desde esta UI.'
    ),
});

export type A2UIMessage = z.infer<typeof A2UIMessageSchema>;

export const A2UI_JSON_SCHEMA = {
  type: "object",
  properties: {
    speechText: {
      type: "string",
      description:
        'Texto corto, empatico y sereno para sintesis de voz. Maximo 2-3 oraciones. Sin emojis.',
    },
    component: {
      type: "string",
      description: 'Nombre del componente React a renderizar.',
      enum: [...A2UI_COMPONENTS],
    },
    props: {
      type: "object",
      description:
        'Propiedades dinamicas del componente visual con todos sus datos.',
      properties: {
        cardNumber: { type: "string", description: '16 digitos de la tarjeta' },
        cardHolder: { type: "string", description: 'Nombre del titular' },
        expiryDate: { type: "string", description: 'Fecha de vencimiento MM/YY' },
        cvv: { type: "string", description: 'CVV dinamico de 3 digitos' },
        spendingLimit: { type: "number", description: 'Limite de gasto en MXN' },
        remainingSeconds: { type: "number", description: 'Segundos restantes de vida' },
        brand: { type: "string", description: 'visa o mastercard' },

        cardInfo: { type: "object", description: 'Informacion de la tarjeta con id, lastFour, type, isFrozen' },
        suspiciousTransaction: { type: "object", description: 'Transaccion sospechosa' },
        recentTransactions: { type: "array", items: { type: "object" }, description: 'Lista de transacciones recientes' },
        plasticEnabled: { type: "boolean", description: 'Estado del plastico fisico' },

        subscriptions: { type: "array", items: { type: "object" }, description: 'Lista de suscripciones activas' },
        totalMonthlySpend: { type: "number", description: 'Gasto total mensual' },

        maxAmount: { type: "number", description: 'Monto maximo de nomina' },
        minAmount: { type: "number", description: 'Monto minimo' },
        defaultAmount: { type: "number", description: 'Monto preseleccionado' },
        disbursementDate: { type: "string", description: 'Fecha estimada de dispersion' },
        installmentOptions: { type: "array", items: { type: "object" }, description: 'Opciones de quincenas' },
        employerName: { type: "string", description: 'Empresa empleadora' },

        title: { type: "string", description: 'Titulo de confirmacion (o de DynamicBankView)' },
        subtitle: { type: "string", description: 'Subtitulo (opcional)' },
        description: { type: "string", description: 'Descripcion de confirmacion' },
        details: { type: "array", items: { type: "object" }, description: 'Detalles clave-valor' },
        folio: { type: "string", description: 'Folio de operacion' },
        type: { type: "string", description: 'payment | card | subscription | dispute | advance' },

        elements: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string", description: 'header | text | key_value | bar_chart | action_button' },
              content: { type: "string", description: 'Texto del header o text' },
              label: { type: "string", description: 'Etiqueta para key_value o action_button' },
              value: { type: "string", description: 'Valor para key_value' },
              action: { type: "string", description: 'Evento para action_button' },
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    label: { type: "string" },
                    value: { type: "number" }
                  }
                },
                description: 'Datos para bar_chart'
              }
            }
          },
          description: 'Elementos generativos para DynamicBankView'
        }
      },
    },
    availableActions: {
      type: "array",
      description:
        'Acciones disponibles para el usuario desde esta UI.',
      items: { type: "object" },
    },
  },
  required: ['speechText', 'component', 'props', 'availableActions'],
};
