import { generateId, generateCardNumber, generateCVV } from '../utils/id.js';
import { CardModel } from './models.js';
import { getUserOrThrow } from './users.js';

export interface Card {
  id: string;
  userId: string;
  type: 'physical' | 'virtual';
  number: string;
  label: string;
  balance: number;
  limit: number;
  cvv: string;
  status: 'active' | 'frozen';
  createdAt: string;
  expiresAt: string | null;
  destroyedAt: string | null;
}

export async function seedCards(): Promise<void> {
  const count = await CardModel.countDocuments();
  if (count > 0) return;
  const c = {
    _id: 'card_fisica_001',
    id: 'card_fisica_001',
    userId: 'usr_banorte_demo',
    type: 'physical',
    number: '4915 8832 7741 3029',
    label: 'Tarjeta Banorte Platinum',
    balance: 80000,
    limit: 80000,
    cvv: '814',
    status: 'frozen',
    createdAt: new Date('2025-01-15T10:00:00Z'),
    expiresAt: null,
    destroyedAt: null
  };
  await CardModel.create(c);
  console.log('Seeded cards');
}

export async function getCard(cardId: string): Promise<Card | undefined> {
  const c = await CardModel.findById(cardId).lean();
  if (!c) return undefined;
  c.id = c._id;
  return c as any;
}

export async function getUserCards(userId: string): Promise<Card[]> {
  const cards = await CardModel.find({ userId }).lean();
  return cards.map(c => ({ ...c, id: c._id })) as any;
}

export async function createVirtualCard(userId: string, limit: number, expiryMinutes: number): Promise<Card> {
  await getUserOrThrow(userId);
  const now = new Date();
  const expires = new Date(now.getTime() + expiryMinutes * 60000);
  const id = generateId('card_virt_');
  const card = {
    _id: id,
    id,
    userId,
    type: 'virtual',
    number: generateCardNumber(),
    label: 'SafeCart Virtual',
    balance: limit,
    limit,
    cvv: generateCVV(),
    status: 'active',
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    destroyedAt: null,
  };
  await CardModel.create(card);
  return card as any;
}

export async function destroyCard(cardId: string): Promise<Card> {
  const card = await CardModel.findByIdAndUpdate(cardId, { status: 'frozen', destroyedAt: new Date().toISOString() }, { new: true }).lean();
  if (!card) throw new Error(`Card ${cardId} not found`);
  card.id = card._id;
  return card as any;
}

export async function freezeCard(cardId: string): Promise<Card> {
  const card = await CardModel.findByIdAndUpdate(cardId, { status: 'frozen' }, { new: true }).lean();
  if (!card) throw new Error(`Card ${cardId} not found`);
  card.id = card._id;
  return card as any;
}
