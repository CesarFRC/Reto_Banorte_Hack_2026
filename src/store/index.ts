// 🟢 Central Store Barrel Export - Async
export * from './models.js';

import { seedUsers } from './users.js';
import { seedCards } from './cards.js';
import { seedTransactions } from './transactions.js';
import { seedSubscriptions } from './subscriptions.js';

export { seedUsers, getUser, getUserOrThrow } from './users.js';
export type { User } from './users.js';

export {
  seedCards,
  getCard,
  getUserCards,
  createVirtualCard,
  destroyCard,
  freezeCard,
} from './cards.js';
export type { Card } from './cards.js';

export {
  seedTransactions,
  getUserTransactions,
  getSuspiciousTransactions,
  getTransaction,
  disputeTransaction,
  addTransaction,
} from './transactions.js';
export type { Transaction } from './transactions.js';

export {
  seedSubscriptions,
  getUserSubscriptions,
  getActiveSubscriptions,
  cancelSubscriptions,
} from './subscriptions.js';
export type { Subscription } from './subscriptions.js';

export async function seedAll(): Promise<void> {
  console.log('\n🟡 Seeding MongoDB...');
  await seedUsers();
  await seedCards();
  await seedTransactions();
  await seedSubscriptions();
  console.log('🟢 Store ready\n');
}
