import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { runAgent } from '../orchestrator/agent.js';
import type { ConversationTurn } from '../orchestrator/agent.js';
import { synthesizeSpeech } from '../voice/elevenlabs.js';
import { generateId } from '../utils/id.js';

// ─── Request/Response Schemas ───────────────────────────
const ChatRequestSchema = z.object({
  message: z.string().min(1),
  userId: z.string().default('usr_banorte_demo'),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(['user', 'model']),
        parts: z.array(z.object({ text: z.string() })),
      })
    )
    .default([]),
  actionContext: z
    .object({
      action: z.string(),
      payload: z.record(z.any()),
    })
    .optional(),
});

type ChatRequest = z.infer<typeof ChatRequestSchema>;

// ─── Route Registration ─────────────────────────────────
export async function chatRoutes(app: FastifyInstance): Promise<void> {
  /**
   * POST /api/chat
   * Main endpoint for the A2UI orchestrator.
   * Receives user messages and action contexts, returns A2UI payloads.
   */
  app.post('/api/chat', async (request, reply) => {
    const startTime = Date.now();

    try {
      // Validate request body
      const body = ChatRequestSchema.parse(request.body);

      console.log(`\n💬 Chat request: "${body.message.slice(0, 80)}..."`);
      if (body.actionContext) {
        console.log(`  🎯 Action context: ${body.actionContext.action}`);
      }

      // ── Run the LLM agent ──────────────────────────────
      const agentResult = await runAgent({
        message: body.message,
        userId: body.userId,
        conversationHistory: body.conversationHistory,
        actionContext: body.actionContext,
      });

      console.log(`  🧩 Component: ${agentResult.a2ui.component}`);
      console.log(`  🔧 Tools used: [${agentResult.toolsUsed.join(', ')}]`);

      // ── Synthesize voice ───────────────────────────────
      let audioUrl: string | null = null;
      if (agentResult.a2ui.speechText) {
        const audioFile = await synthesizeSpeech(agentResult.a2ui.speechText);
        if (audioFile) {
          audioUrl = `/audio/${audioFile}`;
        }
      }

      const elapsed = Date.now() - startTime;
      console.log(`  ⏱️  Response time: ${elapsed}ms`);

      // ── Return response ────────────────────────────────
      return reply.status(200).send({
        a2ui: agentResult.a2ui,
        audioUrl,
        toolsUsed: agentResult.toolsUsed,
        conversationId: generateId('conv'),
        timestamp: new Date().toISOString(),
        latencyMs: elapsed,
      });
    } catch (err: any) {
      console.error('❌ Chat error:', err.message);

      if (err.name === 'ZodError') {
        return reply.status(400).send({
          error: 'Invalid request body',
          details: err.errors,
        });
      }

      return reply.status(500).send({
        error: 'Internal server error',
        message: err.message,
      });
    }
  });
}
