import type { FastifyInstance } from 'fastify';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pipeline } from 'node:stream/promises';
import { transcribeAudio } from '../voice/groq-stt.js';

export async function transcribeRoutes(app: FastifyInstance): Promise<void> {
  /**
   * POST /api/transcribe
   * Receives an audio file (multipart/form-data) and returns the transcribed text.
   */
  app.post('/api/transcribe', async (request, reply) => {
    try {
      const body = request.body as any;
      if (!body || !body.audioBase64) {
        return reply.status(400).send({ error: 'No se encontró audioBase64 en la petición' });
      }

      const filename = body.filename || 'audio.m4a';

      // Guardar el archivo temporalmente desde Base64
      const tempFilePath = path.join(os.tmpdir(), `audio-${Date.now()}-${filename}`);
      const audioBuffer = Buffer.from(body.audioBase64, 'base64');
      fs.writeFileSync(tempFilePath, audioBuffer);

      // Transcribir con Groq
      console.log(`🎙️  Transcribiendo audio (desde Base64): ${filename}...`);
      const startTime = Date.now();
      const transcribedText = await transcribeAudio(tempFilePath);
      const elapsed = Date.now() - startTime;

      // Borrar archivo temporal
      try {
        fs.unlinkSync(tempFilePath);
      } catch (e) {
        console.error('Error borrando archivo temporal:', e);
      }

      if (!transcribedText) {
        return reply.status(500).send({ error: 'No se pudo transcribir el audio' });
      }

      console.log(`✅ Transcripción exitosa (${elapsed}ms): "${transcribedText}"`);
      return reply.status(200).send({ text: transcribedText });
    } catch (err: any) {
      console.error('❌ Error en /api/transcribe:', err.message);
      return reply.status(500).send({ error: 'Error interno del servidor', details: err.message });
    }
  });
}
