import { z } from 'zod';
import type { MCPTool } from '../types.js';
import {
  createVirtualCard,
  destroyCard,
  getCard,
  addTransaction,
} from '../../store/index.js';
import { formatMXN } from '../../utils/currency.js';

// ═══════════════════════════════════════════════════════════
// SAFECART — Tarjetas Virtuales Desechables
// ═══════════════════════════════════════════════════════════

export const generateDisposableCard: MCPTool = {
  name: 'generate_disposable_card',
  description:
    'Genera una tarjeta virtual temporal desechable (SafeCart) con CVV dinámico. Ideal para compras en línea seguras. El usuario especifica el límite de gasto y el tiempo de vida en minutos.',
  parameters: z.object({
    limit: z
      .number()
      .describe('Límite máximo de gasto en MXN para la tarjeta virtual'),
    expiry_minutes: z
      .number()
      .describe(
        'Tiempo de vida de la tarjeta en minutos antes de auto-destruirse'
      ),
  }),
  execute: async (params: { limit: number; expiry_minutes: number }) => {
    const card = await createVirtualCard(
      'usr_banorte_demo',
      params.limit,
      params.expiry_minutes
    );

    return {
      card_id: card.id,
      card_number: card.number,
      last4: card.number.slice(-4),
      cvv: card.cvv,
      limit: params.limit,
      limit_formatted: formatMXN(params.limit),
      expires_at: card.expiresAt,
      expiry_minutes: params.expiry_minutes,
      status: 'active',
      label: card.label,
      message: `Tarjeta SafeCart creada con límite de ${formatMXN(params.limit)}. Se auto-destruirá en ${params.expiry_minutes} minutos.`,
    };
  },
};

export const terminateVirtualCard: MCPTool = {
  name: 'terminate_virtual_card',
  description:
    'Destruye inmediatamente una tarjeta virtual SafeCart. Invalida el token y el CVV dinámico. Útil cuando el usuario ya terminó su compra o detecta uso sospechoso.',
  parameters: z.object({
    card_id: z.string().describe('ID de la tarjeta virtual a destruir'),
  }),
  execute: async (params: { card_id: string }) => {
    const card = await destroyCard(params.card_id);

    return {
      success: true,
      card_id: card.id,
      last4: card.number.slice(-4),
      destroyed_at: card.destroyedAt,
      message: `Tarjeta •••• ${card.number.slice(-4)} destruida exitosamente. El CVV ya no es válido.`,
    };
  },
};

export const simulateMerchantCharge: MCPTool = {
  name: 'simulate_merchant_charge',
  description:
    'Simula un cargo de un comercio a la tarjeta virtual SafeCart. Si el monto excede el límite restante, la tarjeta se auto-destruye. Útil para demostrar la protección en tiempo real.',
  parameters: z.object({
    card_id: z.string().describe('ID de la tarjeta virtual'),
    amount: z.number().describe('Monto del cargo en MXN'),
  }),
  execute: async (params: { card_id: string; amount: number }) => {
    const card = await getCard(params.card_id);
    if (!card) throw new Error(`Tarjeta no encontrada: ${params.card_id}`);
    if (card.status !== 'active')
      throw new Error(`Tarjeta no está activa: ${card.status}`);

    const autoDestroyed = params.amount > card.balance;

    if (!autoDestroyed) {
      // Charge succeeds
      card.balance -= params.amount;

      await addTransaction({
        userId: card.userId,
        cardId: card.id,
        merchant: 'Comercio Simulado',
        amount: params.amount,
        category: 'simulated',
        date: new Date().toISOString(),
        status: 'completed',
        suspicious: false,
        riskScore: 0.0,
        duplicateOf: null,
        description: `Cargo simulado de ${formatMXN(params.amount)}`,
      });
    } else {
      // Over limit — auto-destroy
      await destroyCard(card.id);
    }

    return {
      charged: !autoDestroyed,
      amount: params.amount,
      amount_formatted: formatMXN(params.amount),
      remaining: autoDestroyed ? 0 : card.balance,
      remaining_formatted: autoDestroyed
        ? '$0.00 MXN'
        : formatMXN(card.balance),
      auto_destroyed: autoDestroyed,
      card_status: card.status,
      message: autoDestroyed
        ? `⚠️ Cargo de ${formatMXN(params.amount)} RECHAZADO. Excede el límite. Tarjeta auto-destruida por seguridad.`
        : `Cargo de ${formatMXN(params.amount)} procesado. Saldo restante: ${formatMXN(card.balance)}`,
    };
  },
};

// ─── Export all SafeCart tools ───────────────────────────
export const safecartTools: MCPTool[] = [
  generateDisposableCard,
  terminateVirtualCard,
  simulateMerchantCharge,
];
