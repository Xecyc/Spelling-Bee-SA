import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { INITIAL_WHEELS } from './src/utils/defaultData.ts';

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json({ limit: '50mb' }));

// Wheels persistence file path (shared for all PCs accessing server)
const DATA_DIR = path.resolve(process.cwd(), 'data');
const WHEELS_FILE = path.join(DATA_DIR, 'wheels.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to read wheels
function getSavedWheels() {
  try {
    if (fs.existsSync(WHEELS_FILE)) {
      const content = fs.readFileSync(WHEELS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading wheels file:', err);
  }
  return INITIAL_WHEELS;
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
      fs.writeFileSync(WHEELS_FILE, JSON.stringify(wheels, null, 2), 'utf-8');
      return res.json({ success: true, count: wheels.length });
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
Rules:
1. Each wheel must have a concise title such as "1st Grade - 1st Place", "1st Grade - 2nd/3rd Place", "2nd Grade - 1st Place", "5th Grade", "High School - 1st Place", etc.
2. Group must be strictly 'elementary' or 'high_school'.
3. Grade should be "1st", "2nd", "3rd", "4th", "5th", "6th", or "High School".
4. Place should be '1st' or '2nd_3rd'. Default timer duration: 40 seconds for '1st' place, 20 seconds for '2nd_3rd' place.
5. Slices must be an array of uppercase words. Assign distinct vibrant colors to each word slice.
6. Clean up any numbering, bullet points, definitions, or pronunciation guides; keep only the pure uppercase spelling bee word in slice text.

Document Text:
${text.slice(0, 50000)}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
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
                    description: 'List of uppercase spelling bee words for this wheel',
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

    const jsonStr = (response.text ?? '{}').trim();
    const parsed = JSON.parse(jsonStr);
    return res.json(parsed);
  } catch (err: any) {
    console.error('Gemini word analysis error:', err);
    return res.status(500).json({ error: err.message || 'Failed to analyze words' });
  }
});

// Vite middleware in development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
