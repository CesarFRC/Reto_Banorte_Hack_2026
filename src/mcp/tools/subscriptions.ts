import { z } from 'zod';
import type { MCPTool } from '../types.js';
import {
  getActiveSubscriptions,
  cancelSubscriptions as cancelSubsInStore,
} from '../../store/index.js';
import { formatMXN } from '../../utils/currency.js';

// ═══════════════════════════════════════════════════════════
// SUSCRIPCIONES — Gestión de Cargos Recurrentes
// ═══════════════════════════════════════════════════════════

export const getRecurringSubscriptions: MCPTool = {
  name: 'get_recurring_subscriptions',
  description:
    'Obtiene todas las suscripciones activas del usuario con cargos recurrentes (Netflix, Spotify, Smart Fit, etc.). Incluye montos, fechas de próximo cobro y total mensual.',
  parameters: z.object({
    user_id: z.string().describe('ID del usuario'),
  }),
  execute: async (params: { user_id: string }) => {
    const subs = getActiveSubscriptions(params.user_id);
    const totalMonthly = subs.reduce((sum, s) => sum + s.amount, 0);

    return {
      count: subs.length,
      total_monthly: totalMonthly,
      total_monthly_formatted: formatMXN(totalMonthly),
      total_yearly: totalMonthly * 12,
      total_yearly_formatted: formatMXN(totalMonthly * 12),
      subscriptions: subs.map((s) => ({
        subscription_id: s.id,
        merchant: s.merchant,
        amount: s.amount,
        amount_formatted: formatMXN(s.amount),
        frequency: s.frequency,
        next_charge_date: s.nextChargeDate,
        category: s.category,
        logo_url: s.logoUrl,
        token_status: s.tokenStatus,
      })),
      message: `Tienes ${subs.length} suscripciones activas por un total de ${formatMXN(totalMonthly)}/mes (${formatMXN(totalMonthly * 12)}/año).`,
    };
  },
};

export const cancelSubscriptionTokens: MCPTool = {
  name: 'cancel_subscription_tokens',
  description:
    'Bloquea los tokens de cobro de una o más suscripciones, cancelando efectivamente los cargos recurrentes. El comercio ya no podrá cobrar a la tarjeta del usuario.',
  parameters: z.object({
    subscription_ids: z
      .array(z.string())
      .describe('Array de IDs de suscripciones a cancelar'),
  }),
  execute: async (params: { subscription_ids: string[] }) => {
    const result = cancelSubsInStore(params.subscription_ids);

    return {
      cancelled: result.cancelled,
      cancelled_count: result.cancelled.length,
      saved_monthly: result.savedMonthly,
      saved_monthly_formatted: formatMXN(result.savedMonthly),
      saved_yearly: result.savedMonthly * 12,
      saved_yearly_formatted: formatMXN(result.savedMonthly * 12),
      message:
        result.cancelled.length > 0
          ? `✅ ${result.cancelled.length} suscripción(es) cancelada(s). Ahorrarás ${formatMXN(result.savedMonthly)}/mes (${formatMXN(result.savedMonthly * 12)}/año).`
          : 'No se encontraron suscripciones activas con esos IDs.',
    };
  },
};

// ─── Export all Subscription tools ──────────────────────
export const subscriptionTools: MCPTool[] = [
  getRecurringSubscriptions,
  cancelSubscriptionTokens,
];
