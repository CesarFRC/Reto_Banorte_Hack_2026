import mongoose from 'mongoose';
import { env } from './env.js';

export const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.warn('?O MONGODB_URI no está definido en el archivo .env. Usando mock_mode...');
      return false;
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Ys? Conectado a MongoDB Atlas');
    return true;
  } catch (error) {
    console.error('?O Error conectando a MongoDB:', error);
    process.exit(1);
  }
};
