import express from 'express';
import http from 'http';
import os from 'os';
import { Server as SocketIOServer } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { INITIAL_WHEELS } from './src/utils/defaultData.ts';
import {
  VIBRANT_STAGE_PALETTE,
  CHAMPIONSHIP_PALETTE,
  recalibrateSliceColors,
} from './src/utils/palette.ts';

import { AtomicStore } from './server/storage/atomicStore.ts';

function sanitizeServerWheel(wheel: any): any {
  if (!wheel || !Array.isArray(wheel.slices)) return wheel;
  const palette = (wheel.group === 'high_school' && wheel.place === 'championship')
    ? CHAMPIONSHIP_PALETTE
    : VIBRANT_STAGE_PALETTE;
  return {
    ...wheel,
    slices: recalibrateSliceColors(wheel.slices, palette),
  };
}

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const port = 3000;

// Attach Socket.io with open CORS for stage & local network mobile remote
const io = new SocketIOServer(httpServer, {
  path: '/socket.io',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  transports: ['polling', 'websocket'],
  allowEIO3: true,
  pingTimeout: 30000,
  pingInterval: 10000,
});

// Strictly typed payload for remote controlled winner podium
interface WinnersPayload {
  first: string;
  second: string;
  third: string;
}

let currentWinners: WinnersPayload | null = null;
let isWinnersActive = false;

// Persistent wheels storage with atomic temp-file swap & corruption recovery
const DATA_DIR = path.resolve(process.cwd(), 'data');
const WHEELS_FILE = path.join(DATA_DIR, 'wheels.json');
const wheelsStore = new AtomicStore<any[]>(WHEELS_FILE);

let latestStageState: any = null;

io.on('connection', (socket) => {
  // Heartbeat ping-pong for live latency calculation
  socket.on('ping', (startTime: number) => {
    socket.emit('pong', startTime);
  });

  // If podium is active, sync newly connected stage display or remote
  if (isWinnersActive && currentWinners) {
    socket.emit('show_winners', currentWinners);
  }

  // If stage state is active, sync newly connected remote immediately
  if (latestStageState) {
    socket.emit('stage_state', latestStageState);
  }

  // Allow remote to request immediate stage state snapshot
  socket.on('request_stage_state', () => {
    if (latestStageState) {
      socket.emit('stage_state', latestStageState);
    }
  });

  // Listen for push_winners event from mobile remote
  socket.on('push_winners', (data: WinnersPayload) => {
    currentWinners = {
      first: typeof data?.first === 'string' ? data.first.trim() : '',
      second: typeof data?.second === 'string' ? data.second.trim() : '',
      third: typeof data?.third === 'string' ? data.third.trim() : '',
    };
    isWinnersActive = true;
    io.emit('show_winners', currentWinners);
  });

  // Listen for clear_board event from mobile remote
  socket.on('clear_board', () => {
    currentWinners = null;
    isWinnersActive = false;
    io.emit('hide_winners');
  });

  // Stage state synchronization
  socket.on('sync_stage_state', (state: any) => {
    latestStageState = state;
    socket.broadcast.emit('stage_state', state);
  });

  // Remote roulette & timer action relays
  socket.on('spin_wheel', () => {
    io.emit('spin_wheel');
  });

  socket.on('stop_spin', () => {
    io.emit('stop_spin');
  });

  socket.on('start_timer', () => {
    io.emit('start_timer');
  });

  socket.on('pause_timer', () => {
    io.emit('pause_timer');
  });

  socket.on('reset_timer', () => {
    io.emit('reset_timer');
  });

  socket.on('remove_word', () => {
    io.emit('remove_word');
  });

  socket.on('close_modal', () => {
    io.emit('close_modal');
  });

  socket.on('set_slide', (slide: number) => {
    io.emit('set_slide', slide);
  });
});

app.use(express.json({ limit: '50mb' }));

// ============================================================================
// UNIVERSAL REMOTE CONTROL HTTP & SSE RELAY (Guarantees Cloud Run & mobile sync)
// ============================================================================
interface RemoteMessage {
  id: number;
  type: string;
  payload?: any;
  timestamp: number;
}
let messageHistory: RemoteMessage[] = [];
let nextMsgId = 1;
const sseClients: express.Response[] = [];

// Broadcast remote event to all connected channels
function dispatchRemoteMessage(type: string, payload?: any) {
  const msg: RemoteMessage = { id: nextMsgId++, type, payload, timestamp: Date.now() };
  messageHistory.push(msg);
  if (messageHistory.length > 80) messageHistory.shift();

  // 1. Relay to Socket.io clients
  io.emit(type, payload);
  io.emit('remote_action', msg);

  // 2. Relay to Server-Sent Events (SSE) clients
  const sseData = `data: ${JSON.stringify(msg)}\n\n`;
  for (let i = sseClients.length - 1; i >= 0; i--) {
    try {
      sseClients[i].write(sseData);
    } catch {
      sseClients.splice(i, 1);
    }
  }
  return msg;
}

// 1. HTTP POST: Dispatch any remote command (spin_wheel, set_slide, push_winners, etc.)
app.post('/api/remote/action', (req, res) => {
  const { type, payload } = req.body;
  if (!type || typeof type !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid action type' });
  }

  if (type === 'push_winners' && payload) {
    currentWinners = {
      first: typeof payload.first === 'string' ? payload.first.trim() : '',
      second: typeof payload.second === 'string' ? payload.second.trim() : '',
      third: typeof payload.third === 'string' ? payload.third.trim() : '',
    };
    isWinnersActive = true;
    io.emit('show_winners', currentWinners);
  } else if (type === 'clear_board') {
    currentWinners = null;
    isWinnersActive = false;
    io.emit('hide_winners');
  }

  const msg = dispatchRemoteMessage(type, payload);
  res.json({ ok: true, id: msg.id });
});

// 2. SSE Stream: Real-time event stream for stage and remote clients
app.get('/api/remote/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });
  res.write(': connected\n\n');
  sseClients.push(res);

  // Heartbeat ping every 15s to keep connection alive
  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    const idx = sseClients.indexOf(res);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
});

// 3. HTTP Poll fallback: In case SSE is buffered by proxies
app.get('/api/remote/poll', (req, res) => {
  const since = parseInt(req.query.since as string) || 0;
  const newMessages = messageHistory.filter((m) => m.id > since);
  res.json({
    messages: newMessages,
    latestId: messageHistory[messageHistory.length - 1]?.id || 0,
    latestStageState,
    currentWinners,
  });
});

// 4. Stage State sync endpoint
app.post('/api/remote/stage-state', (req, res) => {
  const { state } = req.body;
  if (state) {
    latestStageState = state;
    dispatchRemoteMessage('stage_state', state);
  }
  res.json({ ok: true });
});

app.get('/api/remote/stage-state', (req, res) => {
  res.json({
    state: latestStageState,
    winners: currentWinners,
  });
});

// Helper to read wheels safely (sanitized with odd-boundary protection)
function getSavedWheels() {
  const wheels = wheelsStore.read(INITIAL_WHEELS);
  const rawWheels = Array.isArray(wheels) && wheels.length > 0 ? wheels : INITIAL_WHEELS;
  return rawWheels.map(sanitizeServerWheel);
}

// API: Get wheels (shared across all PCs)
app.get('/api/wheels', (req, res) => {
  const wheels = getSavedWheels();
  res.json({ wheels });
});

// API: Save wheels (broadcasted to any PC fetching)
app.post('/api/wheels', (req, res) => {
  try {
    const { wheels } = req.body;
    if (Array.isArray(wheels)) {
      const sanitized = wheels.map(sanitizeServerWheel);
      const success = wheelsStore.write(sanitized);
      if (success) {
        return res.json({ success: true, count: sanitized.length });
      }
      return res.status(500).json({ error: 'Failed atomic write for wheels' });
    }
    return res.status(400).json({ error: 'Invalid wheels payload' });
  } catch (err) {
    console.error('Error saving wheels:', err);
    return res.status(500).json({ error: 'Failed to save wheels' });
  }
});

// API: Analyze words with Gemini AI (server-side only)
app.post('/api/analyze-words', async (req, res) => {
  try {
    const { text, filename } = req.body;
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text content is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'Gemini API key is not configured in server environment',
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = `You are an expert Spelling Bee contest coordinator. Analyze the following document text (from file "${filename || 'document'}") which contains spelling bee words classified by grade, year, round, or group.
Extract and organize all words into distinct spelling bee wheels.

CRITICAL RULES FOR WORD EXTRACTION:
1. Extract ONLY the primary base English word.
2. STRIP ALL SPANISH TRANSLATIONS: For example, if the document has "window - ventana", "animal - animal", or "dog (perro)", extract ONLY "WINDOW", "ANIMAL", "DOG". Do NOT include the Spanish translation.
3. STRIP MULTIPLE VERB FORMS AND TENSES: For example, if the document has "Forbid - Forbade - Forbidden", "Write - Wrote - Written", or "Eat / Ate / Eaten", extract ONLY the first base infinitive word: "FORBID", "WRITE", "EAT". Do NOT include past or participle forms.
4. COMPOUND WORDS: Keep valid hyphenated English compound words intact (e.g., "ICE-CREAM", "WELL-KNOWN", "TIE-BREAKER"), but strip any definitions, explanations, or translations that appear after a dash or slash.
5. PURE ENGLISH UPPERCASE: Every word must be a clean, uppercase English spelling bee word (letters A-Z and optional internal hyphen). Never include Spanish accents, definitions, numbers, or parts of speech (like noun, verb, adj).
6. WHEEL STRUCTURE:
   - Each wheel must have a concise title such as "1st Grade - 1st Place", "1st Grade - 2nd/3rd Place", "2nd Grade - 1st Place", "5th Grade - 1st Place", "High School - 1st Place", etc.
   - Group must be strictly 'elementary' or 'high_school'.
   - Grade should be "1st", "2nd", "3rd", "4th", "5th", "6th", or "High School".
   - Place should be '1st' or '2nd_3rd'. Default timer duration: 40 seconds for '1st' place, 20 seconds for '2nd_3rd' place.

Document Text:
${text.slice(0, 50000)}
`;

    // Multi-tier model fallback chain to handle 503 high-demand spikes
    const CANDIDATE_MODELS = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
    let lastError: any = null;
    let responseText: string | null = null;

    for (const modelName of CANDIDATE_MODELS) {
      try {
        console.log(`[AI Studio] Analyzing words with model: ${modelName}...`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                wheels: {
                  type: Type.ARRAY,
                  description: 'List of extracted spelling bee wheels',
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING, description: 'Wheel title, e.g. 1st Grade - 1st Place' },
                      group: { type: Type.STRING, description: 'elementary or high_school' },
                      grade: { type: Type.STRING, description: 'e.g. 1st, 2nd, 3rd, 4th, 5th, 6th, High School' },
                      place: { type: Type.STRING, description: '1st or 2nd_3rd' },
                      timerDuration: { type: Type.NUMBER, description: '40 or 20 seconds' },
                      words: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: 'List of clean uppercase English base words for this wheel',
                      },
                    },
                    required: ['name', 'group', 'words'],
                  },
                },
              },
              required: ['wheels'],
            },
          },
        });

        if (response.text) {
          responseText = response.text;
          break; // Succeeded!
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[AI Studio] Model ${modelName} failed (${err.message}). Trying fallback...`);
        // Brief delay before trying next model
        await new Promise((r) => setTimeout(r, 600));
      }
    }

    if (!responseText) {
      const errMsg = lastError?.message || 'Gemini model service is currently unavailable.';
      const isDemandSpike = errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('UNAVAILABLE');
      return res.status(503).json({
        error: isDemandSpike
          ? 'AI model service is experiencing high demand. The fast local parser has been automatically activated for your file.'
          : errMsg,
        isDemandSpike: true,
      });
    }

    const parsed = JSON.parse(responseText.trim());

    // Server-side post-sanitizer ensuring only the first base English word is kept
    function sanitizeServerWord(raw: string): string | null {
      if (!raw || typeof raw !== 'string') return null;
      let w = raw.replace(/^[0-9]+[.)\-]\s*/, '').trim();
      w = w.replace(/\s*\([^)]*\)/g, '').trim();
      const parts = w.split(/\s+[-—/|]\s+|\s*\/\s*/);
      const first = parts[0]?.trim() || '';
      const tokens = first.split(/\s+/);
      const token = tokens[0]?.trim() || '';
      const clean = token.toUpperCase().replace(/[^A-Z-]/g, '').replace(/^-+|-+$/g, '');
      return clean.length >= 2 ? clean : null;
    }

    if (Array.isArray(parsed.wheels)) {
      parsed.wheels = parsed.wheels.map((w: any) => {
        const rawWords: string[] = Array.isArray(w.words) ? w.words : [];
        const sanitizedWords: string[] = [];
        for (const rw of rawWords) {
          const sw = sanitizeServerWord(rw);
          if (sw && !sanitizedWords.includes(sw)) {
            sanitizedWords.push(sw);
          }
        }
        return {
          ...w,
          words: sanitizedWords,
        };
      });
    }

    return res.json(parsed);
  } catch (err: any) {
    console.error('Gemini word analysis error:', err);
    return res.status(500).json({
      error: 'Could not complete AI word analysis. Using local fast parser.',
      details: err.message,
    });
  }
});

// API: Discover host LAN IP for the Stage Remote QR code
app.get('/api/network-ip', (req, res) => {
  const interfaces = os.networkInterfaces();
  const addresses: string[] = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  res.json({
    localIp: addresses[0] || 'localhost',
    allIps: addresses,
    port,
  });
});

// Vite middleware in development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Explicit fallback for /remote and any SPA sub-routes in dev mode
    app.get(['/remote', '/remote/*'], async (req, res, next) => {
      try {
        const indexHtmlPath = path.resolve(process.cwd(), 'index.html');
        const rawTemplate = fs.readFileSync(indexHtmlPath, 'utf-8');
        const transformedHtml = await vite.transformIndexHtml(req.originalUrl, rawTemplate);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(transformedHtml);
      } catch (err) {
        next(err);
      }
    });
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`Server with Socket.io listening on http://0.0.0.0:${port}`);
  });
}

startServer();
