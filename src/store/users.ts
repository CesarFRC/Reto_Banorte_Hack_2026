import { generateId, generateCardNumber, generateCLABE } from '../utils/id.js';

// ─── Types ──────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  salary: number;
  clabe: string;
  cards: string[];
  riskProfile: 'low' | 'medium' | 'high';
  payrollDay: number; // Day of month
}

// ─── Store ──────────────────────────────────────────────
export const usersStore = new Map<string, User>();

// ─── Seed ───────────────────────────────────────────────
export function seedUsers(): void {
  const demoUser: User = {
    id: 'usr_banorte_demo',
    name: 'Carlos Mendoza García',
    email: 'carlos.mendoza@email.com',
    salary: 45000,
    clabe: generateCLABE(),
    cards: ['card_fisica_001'],
    riskProfile: 'low',
    payrollDay: 15,
  };

  usersStore.set(demoUser.id, demoUser);

  console.log(`  ✓ Seeded ${usersStore.size} users`);
}

// ─── Helpers ────────────────────────────────────────────
export function getUser(userId: string): User | undefined {
  return usersStore.get(userId);
}

export function getUserOrThrow(userId: string): User {
  const user = usersStore.get(userId);
  if (!user) throw new Error(`Usuario no encontrado: ${userId}`);
  return user;
}
