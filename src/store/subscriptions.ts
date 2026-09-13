import { SubscriptionModel } from './models.js';

export interface Subscription {
  id: string;
  userId: string;
  merchant: string;
  amount: number;
  currency: 'MXN' | 'USD';
  frequency: 'monthly' | 'yearly' | 'weekly';
  nextChargeDate: string; // YYYY-MM-DD
  category: string;
  logoUrl?: string;
  tokenStatus: 'active' | 'cancelled' | 'paused';
  cancelledAt: string | null;
}

export async function seedSubscriptions(): Promise<void> {
  const count = await SubscriptionModel.countDocuments();
  if (count > 0) return;
  console.log('Seeded subscriptions - handled via db');
}

export async function getUserSubscriptions(userId: string): Promise<Subscription[]> {
  const subs = await SubscriptionModel.find({ userId }).lean();
  return subs.map(s => ({ ...s, id: s._id })) as any;
}

export async function getActiveSubscriptions(userId: string): Promise<Subscription[]> {
  const subs = await SubscriptionModel.find({ userId, tokenStatus: 'active' }).lean();
  return subs.map(s => ({ ...s, id: s._id })) as any;
}

export async function cancelSubscriptions(subIds: string[]): Promise<{cancelled: string[], savedMonthly: number}> {
  const res = await SubscriptionModel.updateMany(
    { _id: { $in: subIds } },
    { $set: { tokenStatus: 'cancelled', cancelledAt: new Date().toISOString() } }
  );
  return { cancelled: subIds, savedMonthly: 0 };
}
