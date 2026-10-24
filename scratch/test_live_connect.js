import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenAI } from '@google/genai';
import { SYSTEM_INSTRUCTION, REPORT_CALL_RISK_TOOL } from '../server/scamDetectorPrompt.js';

const masterAi = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function testLive() {
  console.log('1. Creating ephemeral token for gemini-3.8-live...');
  const tokenObj = await masterAi.authTokens.create({
    config: {
      uses: 5,
      expireTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      liveConnectConstraints: {
        model: 'gemini-3.8-live',
        config: {
          responseModalities: ['AUDIO'],
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
          tools: [{ functionDeclarations: [REPORT_CALL_RISK_TOOL] }],
        },
      },
    },
  });

  console.log('✅ Ephemeral Token created:', tokenObj.name);

  console.log('2. Connecting to Gemini Live API via WebSocket using ephemeral token...');
  const liveAi = new GoogleGenAI({ apiKey: tokenObj.name });

  let connected = false;
  const session = await liveAi.live.connect({
    model: 'gemini-3.8-live',
    callbacks: {
      onopen: () => {
        connected = true;
        console.log('🎉 Gemini Live API WebSocket CONNECTED successfully!');
      },
      onmessage: (msg) => {
        console.log('Live message received:', Object.keys(msg));
      },
      onerror: (err) => {
        console.log('Live WebSocket error:', err);
      },
      onclose: (e) => {
        console.log('Live WebSocket closed:', e.reason);
      },
    },
  });

  // Wait 3 seconds to confirm handshake
  await new Promise((r) => setTimeout(r, 3000));
  console.log('Handshake check: connected =', connected);
  await session.close();
  console.log('Live session closed cleanly.');
}

testLive().catch(console.error);
