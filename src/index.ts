import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import * as path from 'node:path';
import * as fs from 'node:fs';

import { env, hasGeminiKey, hasElevenLabsKey } from './config/env.js';
import { seedAll } from './store/index.js';
import { connectDB } from './config/db.js';
import { mcpRegistry } from './mcp/registry.js';
import { chatRoutes } from './routes/chat.js';

// ─── Import MCP Tools ───────────────────────────────────
import { safecartTools } from './mcp/tools/safecart.js';
import { sentinelTools } from './mcp/tools/sentinel.js';
import { subscriptionTools } from './mcp/tools/subscriptions.js';
import { payrollTools } from './mcp/tools/payroll.js';
import { accountTools } from './mcp/tools/account.js';

// ═══════════════════════════════════════════════════════════
// BANORTE A2UI BACKEND — Entry Point
// ═══════════════════════════════════════════════════════════

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   🏦  BANORTE A2UI BACKEND ORCHESTRATOR     ║');
  console.log('║   Reto Banorte x Tec de Monterrey 2026      ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');

  // ── 1. Seed the in-memory store ─────────────────────────
  await connectDB();
  await seedAll();

  // ── 2. Register MCP Tools ───────────────────────────────
  console.log('🔧 Registering MCP tools...');
  mcpRegistry.registerAll(safecartTools);
  mcpRegistry.registerAll(sentinelTools);
  mcpRegistry.registerAll(subscriptionTools);
  mcpRegistry.registerAll(payrollTools);
  mcpRegistry.registerAll(accountTools);
  console.log(`  ✓ ${mcpRegistry.size} tools registered: [${mcpRegistry.getToolNames().join(', ')}]`);
  console.log('');

  // ── 3. Create Fastify server ────────────────────────────
  const app = Fastify({
    logger: false, // We handle our own logging
  });

  // ── 4. Register plugins ─────────────────────────────────
  await app.register(cors, {
    origin: true, // Allow all origins for hackathon
    methods: ['GET', 'POST', 'OPTIONS'],
  });

  // Serve audio files statically
  const audioDir = path.join(process.cwd(), 'audio');
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }
  await app.register(fastifyStatic, {
    root: audioDir,
    prefix: '/audio/',
    decorateReply: false,
  });

  // ── 5. Health check endpoint ────────────────────────────
  app.get('/api/health', async () => {
    return {
      status: 'ok',
      service: 'banorte-a2ui-backend',
      version: '1.0.0',
      tools: mcpRegistry.size,
      toolNames: mcpRegistry.getToolNames(),
      gemini: hasGeminiKey ? 'connected' : 'mock_mode',
      elevenlabs: hasElevenLabsKey ? 'connected' : 'disabled',
      timestamp: new Date().toISOString(),
    };
  });

  // ── 6. Register routes ──────────────────────────────────
  await app.register(chatRoutes);

  // ── 7. Start server ─────────────────────────────────────
  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    console.log('🚀 Server ready!');
    console.log(`   Local:   http://localhost:${env.PORT}`);
    console.log(`   Health:  http://localhost:${env.PORT}/api/health`);
    console.log(`   Chat:    POST http://localhost:${env.PORT}/api/chat`);
    console.log('');
    console.log(`   Gemini:      ${hasGeminiKey ? '✅ Connected' : '⚠️  Mock mode (set GOOGLE_GENAI_API_KEY)'}`);
    console.log(`   ElevenLabs:  ${hasElevenLabsKey ? '✅ Connected' : '⚠️  Disabled (set ELEVENLABS_API_KEY)'}`);
    console.log('');
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

main();
