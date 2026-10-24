import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function testTTS() {
  console.log('Testing gemini-3.8-flash-tts speech generation...');
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-3.8-flash-tts',
      contents: [
        {
          role: 'user',
          parts: [{ text: 'Hello, this is a real spoken voice test for phone scam detection.' }],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: 'Puck',
            },
          },
        },
      },
    });

    const candidate = res.candidates?.[0];
    const part = candidate?.content?.parts?.find((p) => p.inlineData && p.inlineData.mimeType?.startsWith('audio/'));
    if (part) {
      console.log('✅ gemini-3.8-flash-tts generated audio! MimeType:', part.inlineData.mimeType);
      const buf = Buffer.from(part.inlineData.data, 'base64');
      console.log('Audio bytes length:', buf.length);
      fs.writeFileSync('scratch/test_spoken.wav', buf);
      return true;
    } else {
      console.log('No audio part found in candidate:', JSON.stringify(candidate));
      return false;
    }
  } catch (err) {
    console.error('TTS generation error:', err);
    return false;
  }
}

testTTS();
