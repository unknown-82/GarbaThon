import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const audioDir = path.join(rootDir, 'public', 'audio');

if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const CALLS = [
  {
    filename: 'scam_digital_arrest.wav',
    title: 'Digital Arrest Scam (Hindi)',
    voice: 'Puck',
    text: 'नमस्ते! मैं इंस्पेक्टर विक्रम राठौड़ बोल रहा हूँ, मुंबई क्राइम ब्रांच स्पेशल साइबर सेल से। आपके आधार कार्ड पर ताइवान से फेडेक्स पार्सल आया है, जिसमें नशीली दवाएं और पांच नकली पासपोर्ट मिले हैं! आपका अरेस्ट वारंट जारी हो चुका है। आप अभी डिजिटल अरेस्ट में हैं। अगर जेल नहीं जाना चाहते, तो आरबीआई वेरिफिकेशन खाते में तुरंत ₹50,000 ट्रांसफर करें, नहीं तो पुलिस अभी आपको गिरफ्तार करेगी!',
  },
  {
    filename: 'scam_fake_kyc.wav',
    title: 'Fake Bank KYC Scam (Gujarati)',
    voice: 'Charon',
    text: 'નમસ્કાર સાહેબ! હું સ્ટેટ બેંક ઓફ ઇન્ડિયા હેડ ઓફિસ વેરિફિકેશન ડિપાર્ટમેન્ટમાંથી બોલું છું. તમારું બેંક એકાઉન્ટ અને એટીએમ કાર્ડ આગામી ૨ કલાકમાં બ્લોક થઈ જશે કારણ કે તમારું કેવાયસી અપડેટ નથી. ખાતું ચાલુ રાખવું હોય તો તાત્કાલિક તમારો આધાર નંબર આપો અને મોબાઈલ પર આવેલો ૬ આંકડાનો ઓટીપી બોલો, નહીંતર ખાતું કાયમ માટે બંધ થઈ જશે!',
  },
  {
    filename: 'scam_courier.wav',
    title: 'Customs Courier Scam (English)',
    voice: 'Aoede',
    text: 'Attention! This is an urgent security alert from FedEx International Express and Customs Cargo. A parcel registered under your Aadhaar number to Singapore was intercepted containing illegal contraband and synthetic narcotics. The Anti-Narcotics Cell has filed an urgent FIR against you. You must immediately pay clearance penalty fees or face arrest.',
  },
  {
    filename: 'genuine_call.wav',
    title: 'Genuine Family Call (Safe Conversation)',
    voice: 'Fenrir',
    text: 'Hello Mom, good morning! How are you doing today? I am calling from the office. I wanted to let you know that I will pick up your medicines on my way home this evening. Are you preparing the sweets for the festival this weekend? We will visit you on Sunday afternoon for lunch. Take care of yourself, see you soon!',
  },
];

async function generateAll() {
  console.log('🎙️ Generating natural human speech for all 4 demo calls using gemini-3.8-flash-tts...\n');

  for (const call of CALLS) {
    const dest = path.join(audioDir, call.filename);
    console.log(`Processing: ${call.title} (Voice: ${call.voice})...`);

    try {
      const res = await ai.models.generateContent({
        model: 'gemini-3.8-flash-tts',
        contents: [
          {
            role: 'user',
            parts: [{ text: call.text }],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: call.voice,
              },
            },
          },
        },
      });

      const candidate = res.candidates?.[0];
      const part = candidate?.content?.parts?.find(
        (p) => p.inlineData && p.inlineData.mimeType?.startsWith('audio/')
      );

      if (part && part.inlineData?.data) {
        const buf = Buffer.from(part.inlineData.data, 'base64');
        fs.writeFileSync(dest, buf);
        console.log(`  ✅ Successfully saved: ${call.filename} (${buf.length} bytes)\n`);
      } else {
        console.error(`  ❌ Failed to generate audio for ${call.filename}: No audio in response`);
      }
    } catch (err) {
      console.error(`  ❌ Error generating ${call.filename}:`, err.message);
    }
  }

  console.log('🎉 Done! All 4 audio files have been updated with crystal-clear human speech!');
}

generateAll().catch(console.error);
