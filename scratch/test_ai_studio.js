import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
console.log('Testing key configured:', Boolean(apiKey));

const ai = new GoogleGenAI({ apiKey });

async function run() {
  console.log('Testing gemini-3.8-flash generateContent...');
  const resp = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: 'Say: Google AI Studio is connected successfully!',
  });
  console.log('Result:', resp.text?.trim());

  console.log('Testing ai.authTokens.create()...');
  const token = await ai.authTokens.create({
    config: {
      uses: 5,
      expireTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    },
  });
  console.log('Token created successfully. Token name prefix:', token.name?.substring(0, 15) + '...');
}

run().catch(console.error);
