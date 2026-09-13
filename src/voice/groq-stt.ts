import fs from 'node:fs';
import Groq from 'groq-sdk';
import { env, hasGroqKey } from '../config/env.js';

// Inicializar cliente Groq
const groqClient = new Groq({
  apiKey: env.GROQ_API_KEY,
});

/**
 * Transcribe un archivo de audio usando el modelo Whisper de Groq.
 * @param filePath Ruta local del archivo de audio a transcribir.
 * @returns El texto transcrito o null si falla.
 */
export async function transcribeAudio(filePath: string): Promise<string | null> {
  if (!hasGroqKey) {
    console.warn('⚠️ No Groq API key found. Skipping transcription.');
    return null;
  }

  try {
    const transcription = await groqClient.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: 'whisper-large-v3', // Modelo optimizado de Groq
      prompt: 'El usuario está hablando en español sobre su cuenta bancaria de Banorte.',
      language: 'es',
    });

    return transcription.text;
  } catch (error: any) {
    console.error('❌ Error transcibiendo con Groq:', error.message);
    return null;
  }
}
