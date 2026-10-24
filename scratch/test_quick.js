import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
console.log('API Key set:', Boolean(apiKey));

const ai = new GoogleGenAI({ apiKey });

async function run() {
  console.log('Testing authTokens.create()...');
  try {
    const token = await ai.authTokens.create({
      config: {
        uses: 5,
        expireTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      },
    });
    console.log('AuthToken SUCCESS:', token.name);
  } catch (err) {
    console.log('AuthToken ERROR:', err.message);
  }

  const testModels = ['gemini-2.5-flash', 'gemini-3.8-flash', 'gemini-3.5-flash'];
  for (const m of testModels) {
    console.log(`Testing model: ${m}...`);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await ai.models.generateContent({
        model: m,
        contents: 'Say: Online',
      }, { abortSignal: controller.signal });
      clearTimeout(timer);
      console.log(`Model ${m} SUCCESS:`, res.text?.trim());
      break;
    } catch (e) {
      console.log(`Model ${m} FAILED:`, e.message);
    }
  }
}

run().catch(console.error);
