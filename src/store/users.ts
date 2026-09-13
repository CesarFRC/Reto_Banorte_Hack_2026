import { generateId, generateCardNumber, generateCLABE } from '../utils/id.js';
import { UserModel } from './models.js';

export interface User {
  id: string;
  name: string;
  email: string;
  salary: number;
  clabe: string;
  cards: string[];
  riskProfile: 'low' | 'medium' | 'high';
  payrollDay: number;
}

export async function seedUsers(): Promise<void> {
  const count = await UserModel.countDocuments();
  if (count > 0) return;
  const demoUser = {
    _id: 'usr_banorte_demo',
    id: 'usr_banorte_demo',
    name: 'Carlos Mendoza García',
    email: 'carlos.mendoza@email.com',
    salary: 45000,
    clabe: generateCLABE(),
    cards: ['card_fisica_001'],
    riskProfile: 'low',
    payrollDay: 15,
  };
  await UserModel.create(demoUser);
  console.log('Seeded users');
}

export async function getUser(userId: string): Promise<User | undefined> {
  const u = await UserModel.findById(userId).lean();
  if (!u) return undefined;
  u.id = u._id;
  return u as any;
}

export async function getUserOrThrow(userId: string): Promise<User> {
  const user = await getUser(userId);
  if (!user) throw new Error(`Usuario no encontrado: ${userId}`);
  return user;
}
