// ─── Central Store Barrel Export ─────────────────────────
import { seedUsers } from './users.js';
import { seedCards } from './cards.js';
import { seedTransactions } from './transactions.js';
import { seedSubscriptions } from './subscriptions.js';

export { usersStore, seedUsers, getUser, getUserOrThrow } from './users.js';
export type { User } from './users.js';

export {
  cardsStore,
  seedCards,
  getCard,
  getUserCards,
  createVirtualCard,
  destroyCard,
  freezeCard,
} from './cards.js';
export type { Card } from './cards.js';

export {
  transactionsStore,
  seedTransactions,
  getUserTransactions,
  getSuspiciousTransactions,
  getTransaction,
  disputeTransaction,
  addTransaction,
} from './transactions.js';
export type { Transaction } from './transactions.js';

export {
  subscriptionsStore,
  seedSubscriptions,
  getUserSubscriptions,
  getActiveSubscriptions,
  cancelSubscriptions,
} from './subscriptions.js';
export type { Subscription } from './subscriptions.js';

// ─── Seed All ───────────────────────────────────────────
export function seedAll(): void {
  console.log('\n🌱 Seeding in-memory store...');
  seedUsers();
  seedCards();
  seedTransactions();
  seedSubscriptions();
  console.log('✅ Store ready\n');
}
