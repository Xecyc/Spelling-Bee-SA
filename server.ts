import express from 'express';
import http from 'http';
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
import { attachRemoteServer } from './server/remoteServer.ts';

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
const port = Number(process.env.PORT) || 3000;
// `npm start` passes --prod so it works on Windows too (no NODE_ENV=production syntax needed).
const isProduction = process.env.NODE_ENV === 'production' || process.argv.includes('--prod');

// Phone remote <-> stage relay (Socket.IO + HTTP fallback). Must be mounted before the global JSON parser
// so the remote API keeps its small body limit.
attachRemoteServer(app, httpServer, { getPort: () => port });

app.use(express.json({ limit: '50mb' }));

// Persistent wheels storage with atomic temp-file swap & corruption recovery
const DATA_DIR = path.resolve(process.cwd(), 'data');
const WHEELS_FILE = path.join(DATA_DIR, 'wheels.json');
const wheelsStore = new AtomicStore<any[]>(WHEELS_FILE);

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


// Vite middleware in development
async function startServer() {
  if (!isProduction) {
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
    console.log(`Stage server listening on http://0.0.0.0:${port} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer();