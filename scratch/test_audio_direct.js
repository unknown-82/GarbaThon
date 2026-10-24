import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import { SYSTEM_INSTRUCTION, REPORT_CALL_RISK_TOOL } from '../server/scamDetectorPrompt.js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function testAudioDirect() {
  console.log('Reading WAV file...');
  const wavBytes = fs.readFileSync('public/audio/genuine_call.wav');
  const base64Wav = wavBytes.toString('base64');
  console.log(`WAV file loaded: ${wavBytes.length} bytes`);

  console.log('Calling gemini-3.8-flash with audio...');
  const t0 = Date.now();
  const res = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: [
      {
        role: 'user',
        parts: [
          { text: `${SYSTEM_INSTRUCTION}\nEvaluate this call audio and return valid JSON:` },
          {
            inlineData: {
              mimeType: 'audio/wav',
              data: base64Wav,
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: REPORT_CALL_RISK_TOOL.parameters,
    },
  });

  console.log(`Success in ${(Date.now() - t0) / 1000}s!`);
  console.log('Result:', res.text);
}

testAudioDirect().catch(console.error);
