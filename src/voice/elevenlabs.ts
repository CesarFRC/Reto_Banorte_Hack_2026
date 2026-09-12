import { env, hasElevenLabsKey } from '../config/env.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { generateId } from '../utils/id.js';

// ─── Audio output directory ─────────────────────────────
const AUDIO_DIR = path.join(process.cwd(), 'audio');

function ensureAudioDir(): void {
  if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
  }
}

/**
 * Synthesizes speech from text using ElevenLabs TTS API.
 * Returns the filename of the generated audio, or null if unavailable.
 */
export async function synthesizeSpeech(
  text: string
): Promise<string | null> {
  if (!hasElevenLabsKey) {
    console.log('  ⚠️  No ElevenLabs API key — skipping TTS');
    return null;
  }

  if (!text || text.trim().length === 0) {
    return null;
  }

  try {
    ensureAudioDir();

    const voiceId = env.ELEVENLABS_VOICE_ID;
    const filename = `${generateId('audio')}.mp3`;
    const filepath = path.join(AUDIO_DIR, filename);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': env.ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.6,
            similarity_boost: 0.8,
            style: 0.3,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ ElevenLabs API error (${response.status}):`, errorText);
      return null;
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(filepath, audioBuffer);

    console.log(`  🔊 TTS generated: ${filename} (${audioBuffer.length} bytes)`);
    return filename;
  } catch (err: any) {
    console.error('❌ ElevenLabs TTS error:', err.message);
    return null;
  }
}
