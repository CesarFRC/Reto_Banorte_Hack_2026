import { generateId, generateCardNumber, generateCVV } from '../utils/id.js';

// ─── Types ──────────────────────────────────────────────
export interface Card {
  id: string;
  userId: string;
  number: string;
  cvv: string;
  type: 'physical' | 'virtual';
  status: 'active' | 'frozen' | 'destroyed';
  limit: number;
  balance: number; // remaining limit for virtual cards
  expiresAt: string | null; // ISO string, null for physical
  createdAt: string;
  destroyedAt: string | null;
  label: string;
}

// ─── Store ──────────────────────────────────────────────
export const cardsStore = new Map<string, Card>();

// ─── Seed ───────────────────────────────────────────────
export function seedCards(): void {
  const physicalCard: Card = {
    id: 'card_fisica_001',
    userId: 'usr_banorte_demo',
    number: '4915 8832 7741 3029',
    cvv: '814',
    type: 'physical',
    status: 'active',
    limit: 80000,
    balance: 80000,
    expiresAt: null,
    createdAt: '2025-01-15T10:00:00Z',
    destroyedAt: null,
    label: 'Tarjeta Banorte Platinum',
  };

  cardsStore.set(physicalCard.id, physicalCard);

  console.log(`  ✓ Seeded ${cardsStore.size} cards`);
}

// ─── Helpers ────────────────────────────────────────────
export function getCard(cardId: string): Card | undefined {
  return cardsStore.get(cardId);
}

export function getUserCards(userId: string): Card[] {
  return Array.from(cardsStore.values()).filter((c) => c.userId === userId);
}

export function createVirtualCard(
  userId: string,
  limit: number,
  expiryMinutes: number
): Card {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiryMinutes * 60 * 1000);

  const card: Card = {
    id: generateId('vcard'),
    userId,
    number: generateCardNumber(),
    cvv: generateCVV(),
    type: 'virtual',
    status: 'active',
    limit,
    balance: limit,
    expiresAt: expiresAt.toISOString(),
    createdAt: now.toISOString(),
    destroyedAt: null,
    label: `SafeCart Virtual • $${limit.toLocaleString()} MXN`,
  };

  cardsStore.set(card.id, card);

  // Auto-destruction timer
  setTimeout(() => {
    const c = cardsStore.get(card.id);
    if (c && c.status === 'active') {
      c.status = 'destroyed';
      c.destroyedAt = new Date().toISOString();
      console.log(`  ⏰ Auto-destroyed virtual card ${card.id} (expired)`);
    }
  }, expiryMinutes * 60 * 1000);

  return card;
}

export function destroyCard(cardId: string): Card {
  const card = cardsStore.get(cardId);
  if (!card) throw new Error(`Tarjeta no encontrada: ${cardId}`);
  card.status = 'destroyed';
  card.destroyedAt = new Date().toISOString();
  return card;
}

export function freezeCard(cardId: string): Card {
  const card = cardsStore.get(cardId);
  if (!card) throw new Error(`Tarjeta no encontrada: ${cardId}`);
  card.status = 'frozen';
  return card;
}
