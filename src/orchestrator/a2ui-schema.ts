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

export const A2UI_GEMINI_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    speechText: {
      type: Type.STRING,
      description:
        'Texto corto, empatico y sereno para sintesis de voz. Maximo 2-3 oraciones. Sin emojis.',
    },
    component: {
      type: Type.STRING,
      description: 'Nombre del componente React a renderizar.',
      enum: [...A2UI_COMPONENTS],
    },
    props: {
      type: Type.OBJECT,
      description:
        'Propiedades dinamicas del componente visual con todos sus datos.',
      properties: {
        cardNumber: { type: Type.STRING, description: '16 digitos de la tarjeta' },
        cardHolder: { type: Type.STRING, description: 'Nombre del titular' },
        expiryDate: { type: Type.STRING, description: 'Fecha de vencimiento MM/YY' },
        cvv: { type: Type.STRING, description: 'CVV dinamico de 3 digitos' },
        spendingLimit: { type: Type.NUMBER, description: 'Limite de gasto en MXN' },
        remainingSeconds: { type: Type.NUMBER, description: 'Segundos restantes de vida' },
        brand: { type: Type.STRING, description: 'visa o mastercard' },

        cardInfo: { type: Type.OBJECT, description: 'Informacion de la tarjeta con id, lastFour, type, isFrozen' },
        suspiciousTransaction: { type: Type.OBJECT, description: 'Transaccion sospechosa' },
        recentTransactions: { type: Type.ARRAY, items: { type: Type.OBJECT }, description: 'Lista de transacciones recientes' },
        plasticEnabled: { type: Type.BOOLEAN, description: 'Estado del plastico fisico' },

        subscriptions: { type: Type.ARRAY, items: { type: Type.OBJECT }, description: 'Lista de suscripciones activas' },
        totalMonthlySpend: { type: Type.NUMBER, description: 'Gasto total mensual' },

        maxAmount: { type: Type.NUMBER, description: 'Monto maximo de nomina' },
        minAmount: { type: Type.NUMBER, description: 'Monto minimo' },
        defaultAmount: { type: Type.NUMBER, description: 'Monto preseleccionado' },
        disbursementDate: { type: Type.STRING, description: 'Fecha estimada de dispersion' },
        installmentOptions: { type: Type.ARRAY, items: { type: Type.OBJECT }, description: 'Opciones de quincenas' },
        employerName: { type: Type.STRING, description: 'Empresa empleadora' },

        title: { type: Type.STRING, description: 'Titulo de confirmacion (o de DynamicBankView)' },
        subtitle: { type: Type.STRING, description: 'Subtitulo (opcional)' },
        description: { type: Type.STRING, description: 'Descripcion de confirmacion' },
        details: { type: Type.ARRAY, items: { type: Type.OBJECT }, description: 'Detalles clave-valor' },
        folio: { type: Type.STRING, description: 'Folio de operacion' },
        type: { type: Type.STRING, description: 'payment | card | subscription | dispute | advance' },

        elements: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, description: 'header | text | key_value | bar_chart | action_button' },
              content: { type: Type.STRING, description: 'Texto del header o text' },
              label: { type: Type.STRING, description: 'Etiqueta para key_value o action_button' },
              value: { type: Type.STRING, description: 'Valor para key_value' },
              action: { type: Type.STRING, description: 'Evento para action_button' },
              data: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    value: { type: Type.NUMBER }
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
      type: Type.ARRAY,
      description:
        'Acciones disponibles para el usuario desde esta UI.',
      items: { type: Type.OBJECT },
    },
  },
  required: ['speechText', 'component', 'props', 'availableActions'],
};
