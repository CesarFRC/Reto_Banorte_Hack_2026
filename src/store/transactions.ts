import { generateId } from '../utils/id.js';
import { TransactionModel } from './models.js';

export interface Transaction {
  id: string;
  userId: string;
  cardId: string;
  merchant: string;
  amount: number;
  category: 'food' | 'transport' | 'entertainment' | 'shopping' | 'services' | 'health' | 'income' | 'simulated';
  date: string; // ISO String
  status: 'completed' | 'pending' | 'disputed' | 'declined';
  suspicious: boolean;
  riskScore: number;
  duplicateOf: string | null;
  description: string;
}

export async function seedTransactions(): Promise<void> {
  const count = await TransactionModel.countDocuments();
  if (count > 0) return;
  console.log('Seeded transactions - DB already has them from your data dump');
}

export async function getUserTransactions(userId: string): Promise<Transaction[]> {
  const txs = await TransactionModel.find({ userId }).sort({ _id: -1 }).lean();
  return txs.map(t => ({ ...t, id: t._id })) as any;
}

export async function getSuspiciousTransactions(userId: string): Promise<Transaction[]> {
  const txs = await TransactionModel.find({ userId, suspicious: true }).lean();
  return txs.map(t => ({ ...t, id: t._id })) as any;
}

export async function getTransaction(txId: string): Promise<Transaction | undefined> {
  const t = await TransactionModel.findById(txId).lean();
  if (!t) return undefined;
  t.id = t._id;
  return t as any;
}

export async function disputeTransaction(txId: string): Promise<Transaction> {
  const t = await TransactionModel.findByIdAndUpdate(txId, { status: 'disputed' }, { new: true }).lean();
  if (!t) throw new Error(`Transacción no encontrada: ${txId}`);
  t.id = t._id;
  return t as any;
}

export async function addTransaction(tx: Omit<Transaction, 'id'>): Promise<Transaction> {
  const id = generateId('tx_');
  const doc = { _id: id, id, ...tx };
  await TransactionModel.create(doc);
  return doc as any;
}
