import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  GOOGLE_GENAI_API_KEY: z.string().default(''),
  GROQ_API_KEY: z.string().default(''),
  ELEVENLABS_API_KEY: z.string().default(''),
  ELEVENLABS_VOICE_ID: z.string().default('pFZP5JQG7iQjIQuC4Bku'),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
});

export const env = envSchema.parse(process.env);

export const hasGeminiKey = env.GOOGLE_GENAI_API_KEY.length > 0;
export const hasGroqKey = env.GROQ_API_KEY.length > 0;
export const hasElevenLabsKey = env.ELEVENLABS_API_KEY.length > 0;
