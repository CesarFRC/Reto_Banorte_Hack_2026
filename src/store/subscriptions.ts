// ─── Types ──────────────────────────────────────────────
export interface Subscription {
  id: string;
  userId: string;
  merchant: string;
  amount: number;
  currency: string;
  frequency: 'monthly' | 'yearly';
  nextChargeDate: string; // ISO
  tokenStatus: 'active' | 'cancelled';
  category: string;
  logoUrl: string; // For the frontend component
  cancelledAt: string | null;
}

// ─── Store ──────────────────────────────────────────────
export const subscriptionsStore = new Map<string, Subscription>();

// ─── Seed ───────────────────────────────────────────────
export function seedSubscriptions(): void {
  const now = new Date();
  const futureDate = (days: number) =>
    new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

  const subs: Subscription[] = [
    {
      id: 'sub_netflix',
      userId: 'usr_banorte_demo',
      merchant: 'Netflix',
      amount: 219,
      currency: 'MXN',
      frequency: 'monthly',
      nextChargeDate: futureDate(5),
      tokenStatus: 'active',
      category: 'streaming',
      logoUrl: 'https://logo.clearbit.com/netflix.com',
      cancelledAt: null,
    },
    {
      id: 'sub_spotify',
      userId: 'usr_banorte_demo',
      merchant: 'Spotify Premium',
      amount: 149,
      currency: 'MXN',
      frequency: 'monthly',
      nextChargeDate: futureDate(12),
      tokenStatus: 'active',
      category: 'streaming',
      logoUrl: 'https://logo.clearbit.com/spotify.com',
      cancelledAt: null,
    },
    {
      id: 'sub_smartfit',
      userId: 'usr_banorte_demo',
      merchant: 'Smart Fit',
      amount: 899,
      currency: 'MXN',
      frequency: 'monthly',
      nextChargeDate: futureDate(8),
      tokenStatus: 'active',
      category: 'fitness',
      logoUrl: 'https://logo.clearbit.com/smartfit.com.br',
      cancelledAt: null,
    },
    {
      id: 'sub_icloud',
      userId: 'usr_banorte_demo',
      merchant: 'Apple iCloud+',
      amount: 49,
      currency: 'MXN',
      frequency: 'monthly',
      nextChargeDate: futureDate(18),
      tokenStatus: 'active',
      category: 'cloud',
      logoUrl: 'https://logo.clearbit.com/apple.com',
      cancelledAt: null,
    },
    {
      id: 'sub_hbomax',
      userId: 'usr_banorte_demo',
      merchant: 'Max (HBO)',
      amount: 199,
      currency: 'MXN',
      frequency: 'monthly',
      nextChargeDate: futureDate(3),
      tokenStatus: 'active',
      category: 'streaming',
      logoUrl: 'https://logo.clearbit.com/max.com',
      cancelledAt: null,
    },
    {
      id: 'sub_chatgpt',
      userId: 'usr_banorte_demo',
      merchant: 'ChatGPT Plus',
      amount: 399,
      currency: 'MXN',
      frequency: 'monthly',
      nextChargeDate: futureDate(22),
      tokenStatus: 'active',
      category: 'ai_tools',
      logoUrl: 'https://logo.clearbit.com/openai.com',
      cancelledAt: null,
    },
  ];

  for (const sub of subs) {
    subscriptionsStore.set(sub.id, sub);
  }

  const total = subs.reduce((acc, s) => acc + s.amount, 0);
  console.log(
    `  ✓ Seeded ${subscriptionsStore.size} subscriptions (total: $${total.toLocaleString()} MXN/mes)`
  );
}

// ─── Helpers ────────────────────────────────────────────
export function getUserSubscriptions(userId: string): Subscription[] {
  return Array.from(subscriptionsStore.values()).filter(
    (s) => s.userId === userId
  );
}

export function getActiveSubscriptions(userId: string): Subscription[] {
  return getUserSubscriptions(userId).filter(
    (s) => s.tokenStatus === 'active'
  );
}

export function cancelSubscriptions(subscriptionIds: string[]): {
  cancelled: string[];
  savedMonthly: number;
} {
  let savedMonthly = 0;
  const cancelled: string[] = [];

  for (const id of subscriptionIds) {
    const sub = subscriptionsStore.get(id);
    if (sub && sub.tokenStatus === 'active') {
      sub.tokenStatus = 'cancelled';
      sub.cancelledAt = new Date().toISOString();
      savedMonthly += sub.amount;
      cancelled.push(id);
    }
  }

  return { cancelled, savedMonthly };
}
