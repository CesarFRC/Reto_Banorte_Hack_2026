import mongoose from 'mongoose';

// User Schema
const userSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: String,
  email: String,
  salary: Number,
  clabe: String,
  cards: [String],
  riskProfile: String,
  payrollDay: Number,
  createdAt: { type: Date, default: Date.now }
});

export const UserModel = mongoose.models.User || mongoose.model('User', userSchema);

// Card Schema
const cardSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  userId: String,
  type: String,
  number: String,
  label: String,
  balance: Number,
  limit: Number,
  cvv: String,
  status: String,
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: null },
  destroyedAt: { type: Date, default: null }
});

export const CardModel = mongoose.models.Card || mongoose.model('Card', cardSchema);

// Transaction Schema
const transactionSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  userId: String,
  cardId: String,
  merchant: String,
  amount: Number,
  category: String,
  date: String,
  status: String,
  suspicious: Boolean,
  riskScore: Number,
  duplicateOf: { type: String, default: null },
  description: String
});

export const TransactionModel = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);

// Subscription Schema
const subscriptionSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  userId: String,
  merchant: String,
  amount: Number,
  currency: String,
  frequency: String,
  nextChargeDate: String,
  category: String,
  logoUrl: String,
  tokenStatus: String,
  cancelledAt: { type: Date, default: null }
});

export const SubscriptionModel = mongoose.models.Subscription || mongoose.model('Subscription', subscriptionSchema);
