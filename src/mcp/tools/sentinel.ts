import { z } from 'zod';
import type { MCPTool } from '../types.js';
import {
  freezeCard as freezeCardInStore,
  getCard,
  getSuspiciousTransactions,
  disputeTransaction,
  createVirtualCard,
} from '../../store/index.js';
import { generateFolio } from '../../utils/id.js';
import { formatMXN } from '../../utils/currency.js';

// ═══════════════════════════════════════════════════════════
// SENTINEL — Fraude y Seguridad
// ═══════════════════════════════════════════════════════════

export const freezeCard: MCPTool = {
  name: 'freeze_card',
  description:
    'Congela inmediatamente una tarjeta (física o virtual) para prevenir cargos no autorizados. La tarjeta queda inactiva hasta que el usuario la descongele.',
  parameters: z.object({
    card_id: z.string().describe('ID de la tarjeta a congelar'),
  }),
  execute: async (params: { card_id: string }) => {
    const card = freezeCardInStore(params.card_id);

    return {
      frozen: true,
      card_id: card.id,
      last4: card.number.slice(-4),
      card_type: card.type,
      frozen_at: new Date().toISOString(),
      label: card.label,
      message: `🧊 Tarjeta •••• ${card.number.slice(-4)} congelada. Ningún cargo será procesado hasta que la descongeles.`,
    };
  },
};

export const getSuspiciousTx: MCPTool = {
  name: 'get_suspicious_tx',
  description:
    'Obtiene las transacciones recientes sospechosas del usuario, incluyendo cargos duplicados y transacciones internacionales no reconocidas. Cada transacción incluye un puntaje de riesgo.',
  parameters: z.object({
    user_id: z.string().describe('ID del usuario'),
  }),
  execute: async (params: { user_id: string }) => {
    const suspicious = getSuspiciousTransactions(params.user_id);

    const totalAtRisk = suspicious.reduce((sum, tx) => sum + tx.amount, 0);

    return {
      count: suspicious.length,
      total_at_risk: totalAtRisk,
      total_at_risk_formatted: formatMXN(totalAtRisk),
      transactions: suspicious.map((tx) => ({
        tx_id: tx.id,
        merchant: tx.merchant,
        amount: tx.amount,
        amount_formatted: formatMXN(tx.amount),
        date: tx.date,
        risk_score: tx.riskScore,
        risk_level:
          tx.riskScore > 0.8
            ? 'critical'
            : tx.riskScore > 0.6
              ? 'high'
              : 'medium',
        is_duplicate: tx.duplicateOf !== null,
        duplicate_of: tx.duplicateOf,
        description: tx.description,
        category: tx.category,
      })),
      message:
        suspicious.length > 0
          ? `⚠️ Se encontraron ${suspicious.length} transacciones sospechosas por un total de ${formatMXN(totalAtRisk)}.`
          : '✅ No se encontraron transacciones sospechosas.',
    };
  },
};

export const fileFraudDispute: MCPTool = {
  name: 'file_fraud_dispute',
  description:
    'Genera un folio oficial de aclaración Banorte para una transacción fraudulenta. Automáticamente congela la tarjeta afectada y emite una tarjeta de reposición digital.',
  parameters: z.object({
    tx_id: z.string().describe('ID de la transacción a disputar'),
  }),
  execute: async (params: { tx_id: string }) => {
    const tx = disputeTransaction(params.tx_id);
    const folio = generateFolio();

    // Freeze the affected card
    const card = getCard(tx.cardId);
    if (card && card.status === 'active') {
      freezeCardInStore(tx.cardId);
    }

    // Issue replacement virtual card
    const replacement = createVirtualCard('usr_banorte_demo', 80000, 60 * 24 * 30); // 30 days

    return {
      folio,
      tx_id: tx.id,
      merchant: tx.merchant,
      disputed_amount: tx.amount,
      disputed_amount_formatted: formatMXN(tx.amount),
      status: 'investigation_opened',
      original_card_frozen: true,
      replacement_card: {
        card_id: replacement.id,
        last4: replacement.number.slice(-4),
        number: replacement.number,
      },
      estimated_resolution: '5 a 10 días hábiles',
      refund_provisional: true,
      message: `📋 Folio de aclaración: ${folio}. Tu tarjeta anterior fue congelada y ya tienes una tarjeta de reposición digital •••• ${replacement.number.slice(-4)}. Abono provisional en 48 horas.`,
    };
  },
};

// ─── Export all Sentinel tools ──────────────────────────
export const sentinelTools: MCPTool[] = [
  freezeCard,
  getSuspiciousTx,
  fileFraudDispute,
];
