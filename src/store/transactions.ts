import { generateId } from '../utils/id.js';

// ─── Types ──────────────────────────────────────────────
export interface Transaction {
  id: string;
  userId: string;
  cardId: string;
  merchant: string;
  amount: number;
  category: string;
  date: string; // ISO
  status: 'completed' | 'pending' | 'disputed' | 'reversed';
  suspicious: boolean;
  riskScore: number; // 0.0 - 1.0
  duplicateOf: string | null; // ID of the original tx if duplicate
  description: string;
}

// ─── Store ──────────────────────────────────────────────
export const transactionsStore = new Map<string, Transaction>();

// ─── Seed ───────────────────────────────────────────────
export function seedTransactions(): void {
  const now = new Date();
  const daysAgo = (d: number) =>
    new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString();
  const hoursAgo = (h: number) =>
    new Date(now.getTime() - h * 60 * 60 * 1000).toISOString();

  const txs: Transaction[] = [
    {
      id: 'tx_001',
      userId: 'usr_banorte_demo',
      cardId: 'card_fisica_001',
      merchant: 'OXXO Reforma 221',
      amount: 187.5,
      category: 'convenience',
      date: daysAgo(1),
      status: 'completed',
      suspicious: false,
      riskScore: 0.1,
      duplicateOf: null,
      description: 'Compra en tienda de conveniencia',
    },
    {
      id: 'tx_002',
      userId: 'usr_banorte_demo',
      cardId: 'card_fisica_001',
      merchant: 'Amazon MX',
      amount: 2499.0,
      category: 'online_shopping',
      date: daysAgo(2),
      status: 'completed',
      suspicious: false,
      riskScore: 0.2,
      duplicateOf: null,
      description: 'Compra en línea Amazon',
    },
    {
      id: 'tx_003',
      userId: 'usr_banorte_demo',
      cardId: 'card_fisica_001',
      merchant: 'Amazon MX',
      amount: 2499.0,
      category: 'online_shopping',
      date: daysAgo(2),
      status: 'completed',
      suspicious: true,
      riskScore: 0.85,
      duplicateOf: 'tx_002',
      description: 'Cargo duplicado — mismo monto, misma fecha, mismo comercio',
    },
    {
      id: 'tx_004',
      userId: 'usr_banorte_demo',
      cardId: 'card_fisica_001',
      merchant: 'WISH.COM *ELECTRONICS',
      amount: 8750.0,
      category: 'international',
      date: hoursAgo(6),
      status: 'completed',
      suspicious: true,
      riskScore: 0.92,
      duplicateOf: null,
      description:
        'Cargo internacional no reconocido a las 3:00 AM — posible fraude',
    },
    {
      id: 'tx_005',
      userId: 'usr_banorte_demo',
      cardId: 'card_fisica_001',
      merchant: 'Uber Eats',
      amount: 342.0,
      category: 'food_delivery',
      date: daysAgo(3),
      status: 'completed',
      suspicious: false,
      riskScore: 0.05,
      duplicateOf: null,
      description: 'Pedido de comida a domicilio',
    },
    {
      id: 'tx_006',
      userId: 'usr_banorte_demo',
      cardId: 'card_fisica_001',
      merchant: 'ALIEXPRESS HK',
      amount: 4200.0,
      category: 'international',
      date: hoursAgo(3),
      status: 'pending',
      suspicious: true,
      riskScore: 0.78,
      duplicateOf: null,
      description: 'Cargo pendiente desde Hong Kong — patrón inusual',
    },
  ];

  for (const tx of txs) {
    transactionsStore.set(tx.id, tx);
  }

  console.log(`  ✓ Seeded ${transactionsStore.size} transactions (${txs.filter(t => t.suspicious).length} suspicious)`);
}

// ─── Helpers ────────────────────────────────────────────
export function getUserTransactions(userId: string): Transaction[] {
  return Array.from(transactionsStore.values()).filter(
    (t) => t.userId === userId
  );
}

export function getSuspiciousTransactions(userId: string): Transaction[] {
  return getUserTransactions(userId).filter((t) => t.suspicious);
}

export function getTransaction(txId: string): Transaction | undefined {
  return transactionsStore.get(txId);
}

export function disputeTransaction(txId: string): Transaction {
  const tx = transactionsStore.get(txId);
  if (!tx) throw new Error(`Transacción no encontrada: ${txId}`);
  tx.status = 'disputed';
  return tx;
}

export function addTransaction(tx: Omit<Transaction, 'id'>): Transaction {
  const id = generateId('tx');
  const fullTx = { ...tx, id };
  transactionsStore.set(id, fullTx);
  return fullTx;
}
