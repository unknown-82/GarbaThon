import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const models = [
  'gemini-flash-latest',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.8-flash',
  'gemini-2.5-flash-native-audio-latest',
];

async function checkModels() {
  for (const m of models) {
    try {
      console.log(`Trying ${m}...`);
      const res = await ai.models.generateContent({
        model: m,
        contents: 'Ping',
      });
      console.log(`✅ ${m} WORKS! Response:`, res.text?.trim());
      break;
    } catch (e) {
      console.log(`❌ ${m} failed:`, e.status || e.message);
    }
  }
}

checkModels();
