import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import { SYSTEM_INSTRUCTION, REPORT_CALL_RISK_TOOL } from './scamDetectorPrompt.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '25mb' }));

// Helper to get GoogleGenAI client
function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'paste_your_key_here' || apiKey.trim().length === 0) return null;
  return new GoogleGenAI({ apiKey });
}

function hasValidApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;
  return Boolean(apiKey && apiKey !== 'paste_your_key_here' && apiKey.trim().length > 0);
}

const LIVE_MODEL = process.env.LIVE_MODEL || process.env.GEMINI_LIVE_MODEL || 'gemini-3.8-live';
const FLASH_MODEL = process.env.FALLBACK_MODEL || process.env.GEMINI_FLASH_MODEL || 'gemini-3.8-flash';
const TTS_MODEL = process.env.TTS_MODEL || 'gemini-3.8-flash-tts';

// Health check endpoint for Cloud Run
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasApiKey: hasValidApiKey(),
    liveModel: LIVE_MODEL,
    flashModel: FLASH_MODEL,
    ttsModel: TTS_MODEL,
  });
});

// GET /api/config: Check API status
app.get('/api/config', (req, res) => {
  res.json({
    hasApiKey: hasValidApiKey(),
    liveModel: LIVE_MODEL,
    flashModel: FLASH_MODEL,
    ttsModel: TTS_MODEL,
    chunkSeconds: parseInt(process.env.CHUNK_SECONDS || '5', 10),
    scamThreshold: parseInt(process.env.SCAM_THRESHOLD || '70', 10),
  });
});

// POST /api/set-key: Set or update GEMINI_API_KEY dynamically
app.post('/api/set-key', (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    return res.status(400).json({ error: 'Valid apiKey is required.' });
  }
  process.env.GEMINI_API_KEY = apiKey.trim();
  res.json({ success: true, message: 'API key configured successfully.' });
});

// 1. GET /api/token: Creates short-lived ephemeral token via ai.authTokens.create()
// Locked to the model, system prompt and tool.
app.get('/api/token', async (req, res) => {
  try {
    const ai = getGenAIClient();
    if (!ai) {
      return res.status(401).json({
        error: 'MISSING_API_KEY',
        message: 'GEMINI_API_KEY is not configured in backend environment or .env file.',
      });
    }

    const liveModel = LIVE_MODEL;
    const expireMinutes = parseInt(process.env.TOKEN_EXPIRE_MINUTES || '30', 10);
    const expireTime = new Date(Date.now() + expireMinutes * 60 * 1000).toISOString();

    const tokenResponse = await ai.authTokens.create({
      config: {
        uses: 10,
        expireTime: expireTime,
        liveConnectConstraints: {
          model: liveModel,
          config: {
            responseModalities: ['AUDIO'],
            systemInstruction: {
              parts: [{ text: SYSTEM_INSTRUCTION }],
            },
            tools: [
              {
                functionDeclarations: [REPORT_CALL_RISK_TOOL],
              },
            ],
            inputAudioTranscription: {},
            realtimeInputConfig: {
              automaticActivityDetection: { disabled: true },
            },
          },
        },
      },
    });

    res.json({
      token: tokenResponse.name,
      model: liveModel,
      expireTime: expireTime,
      tool: REPORT_CALL_RISK_TOOL,
      systemInstruction: SYSTEM_INSTRUCTION,
    });
  } catch (err) {
    console.error('Error generating ephemeral token:', err);
    res.status(500).json({
      error: 'TOKEN_GENERATION_FAILED',
      message: err.message || 'Failed to create ephemeral live token.',
    });
  }
});

// FALLBACK ENDPOINT: POST /api/analyze-chunk
// If Live API chunking misbehaves, send rolling 5 s audio chunks to gemini-3.8-flash
app.post('/api/analyze-chunk', async (req, res) => {
  try {
    const ai = getGenAIClient();
    if (!ai) {
      return res.status(401).json({
        error: 'MISSING_API_KEY',
        message: 'GEMINI_API_KEY is not configured.',
      });
    }

    const { audioData, mimeType, transcriptSoFar, chunkIndex } = req.body;
    const flashModel = FLASH_MODEL;

    const parts = [];

    // System instruction prompt
    parts.push({
      text: `${SYSTEM_INSTRUCTION}

You must evaluate this chunk of the phone call (Chunk #${chunkIndex || 1}) and output the risk evaluation in valid JSON matching the schema.
Cumulative transcript heard so far:
"""
${transcriptSoFar || '(Streaming audio input)'}
"""`,
    });

    if (audioData) {
      parts.push({
        inlineData: {
          mimeType: mimeType || 'audio/wav',
          data: audioData,
        },
      });
    }

    const candidateModels = [
      FLASH_MODEL,
      'gemini-3.7-flash',
      'gemini-flash-latest',
      'gemini-3.5-flash',
    ];

    let response = null;
    let lastErr = null;

    for (const modelName of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: parts,
            },
          ],
          config: {
            responseMimeType: 'application/json',
            responseSchema: REPORT_CALL_RISK_TOOL.parameters,
          },
        });
        if (response && response.text) break;
      } catch (err) {
        lastErr = err;
        console.warn(`Candidate model ${modelName} returned error: ${err.message}. Retrying with next model...`);
      }
    }

    if (!response || !response.text) {
      throw lastErr || new Error('All candidate models failed to generate content');
    }

    const parsedResult = JSON.parse(response.text || '{}');
    res.json(parsedResult);
  } catch (err) {
    console.error('Error in analyze-chunk fallback:', err);
    res.status(500).json({
      error: 'ANALYSIS_FAILED',
      message: err.message || 'Failed to analyze audio chunk',
    });
  }
});

// GET /api/demo-calls: List pre-recorded scam and genuine demo calls
app.get('/api/demo-calls', (req, res) => {
  const demos = [
    {
      id: 'scam_digital_arrest',
      title: 'Digital Arrest Scam (ડિજિટલ એરેસ્ટ / डिजिटल अरेस्ट)',
      language: 'Hindi',
      type: 'SCAM',
      duration: '42s',
      audioFile: '/audio/scam_digital_arrest.wav',
      description: 'Fake Mumbai Police/CBI claims an illegal parcel with narcotics and forged passports was intercepted; threatens immediate Skype video arrest and demands funds transfer for verification.',
      expectedRedFlags: [
        'AUTHORITY_IMPERSONATION',
        'THREAT_ARREST',
        'URGENCY',
        'MONEY_TRANSFER',
        'SECRECY_ISOLATION',
      ],
      simulationCues: [
        {
          atSecond: 4,
          transcript: "नमस्ते, मैं इंस्पेक्टर विक्रम राठौड़ बोल रहा हूँ, मुंबई क्राइम ब्रांच और सीबीआई स्पेशल सेल से।",
          result: {
            risk_level: "SUSPICIOUS",
            score: 45,
            red_flags: [
              { type: "AUTHORITY_IMPERSONATION", evidence: "मैं इंस्पेक्टर विक्रम राठौड़ बोल रहा हूँ, मुंबई क्राइम ब्रांच और सीबीआई स्पेशल सेल से।" }
            ],
            reason_en: "The caller falsely claims to be a senior police officer from Mumbai Crime Branch & CBI.",
            advice_en: "Be cautious. Genuine police never initiate interrogations from private mobile numbers.",
            reason_gu: "કોલ કરનાર વ્યક્તિ મુંબઈ ક્રાઇમ બ્રાન્ચ અને CBI ના પોલીસ અધિકારી હોવાનો દાવો કરી રહ્યો છે.",
            reason_hi: "फोन करने वाला खुद को मुंबई क्राइम ब्रांच और सीबीआई का पुलिस अधिकारी बता रहा है।",
            advice_gu: "સાવધાન રહો. અજાણ્યા નંબર પરથી પોલીસ ક્યારેય ફોન પર ધમકી નથી આપતી.",
            advice_hi: "सावधान रहें। असली पुलिस कभी अनजान नंबर से फोन करके धमकाती नहीं है।"
          }
        },
        {
          atSecond: 14,
          transcript: "आपके आधार नंबर पर ताइवान से फेडेक्स पार्सल आया है, जिसमें 140 ग्राम एमडी ड्रग्स और 5 नकली पासपोर्ट मिले हैं! आपका अरेस्ट वारंट जारी हो चुका है।",
          result: {
            risk_level: "SCAM",
            score: 85,
            red_flags: [
              { type: "AUTHORITY_IMPERSONATION", evidence: "मुंबई क्राइम ब्रांच और सीबीआई स्पेशल सेल" },
              { type: "THREAT_ARREST", evidence: "140 ग्राम ड्रग्स मिले हैं, आपका अरेस्ट वारंट जारी हो चुका है।" },
              { type: "URGENCY", evidence: "तुरंत वीडियो कॉल पर आइए वरना लोकल पुलिस टीम आपके घर आ रही है।" }
            ],
            reason_en: "Classic 'Digital Arrest' scam. Fraudsters fabricate illegal narcotics parcel and fake arrest warrants to induce panic.",
            advice_en: "Hang up immediately! Never join Skype video calls with unknown callers or share IDs.",
            reason_gu: "આ જાણીતો 'ડિજિટલ એરેસ્ટ' સ્કેમ છે. પોલીસ કે કસ્ટમ્સ ક્યારેય ફોન કે વીડિયો પર ધરપકડ નથી કરતી.",
            reason_hi: "यह 'डिजिटल अरेस्ट' का खतरनाक फ्रॉड है। पुलिस कभी फोन या वीडियो कॉल पर अरेस्ट नहीं करती।",
            advice_gu: "તરત જ ફોન કાપી નાખો! કોઈ વીડિયો કોલ ન કરો અને સ્થાનિક પોલીસ હેલ્પલાઇન ૧૯૩૦ પર સંપર્ક કરો.",
            advice_hi: "तुरंत फोन काट दें! किसी वीडियो कॉल में न जुड़ें और साइबर हेल्पलाइन 1930 पर शिकायत करें।"
          }
        },
        {
          atSecond: 28,
          transcript: "आपको अभी डिजिटल अरेस्ट में रखा गया है। किसी को मत बताइए। आरबीआई के वेरिफिकेशन एकाउंट में ₹50,000 तुरंत ट्रांसफर कीजिए, नहीं तो अभी हथकड़ी लगेगी।",
          result: {
            risk_level: "SCAM",
            score: 98,
            red_flags: [
              { type: "AUTHORITY_IMPERSONATION", evidence: "आरबीआई के वेरिफिकेशन एकाउंट" },
              { type: "THREAT_ARREST", evidence: "अभी हथकड़ी लगेगी, डिजिटल अरेस्ट में रखा गया है।" },
              { type: "MONEY_TRANSFER", evidence: "आरबीआई वेरिफिकेशन एकाउंट में ₹50,000 तुरंत ट्रांसफर कीजिए" },
              { type: "SECRECY_ISOLATION", evidence: "कमरे का दरवाजा बंद रखें और किसी को मत बताइए" }
            ],
            reason_en: "Severe extortion attempt! The caller demands a ₹50,000 transfer under threat of 'Digital Arrest', which does not exist in law.",
            advice_en: "Report immediately to Cyber Crime Helpline 1930! Never transfer any money.",
            reason_gu: "ખૂબ જ ખતરનાક ફ્રોડ! કાયદામાં 'ડિજિટલ એરેસ્ટ' જેવો કોઈ નિયમ નથી. તેઓ પૈસા પડાવવા ધમકી આપી રહ્યા છે.",
            reason_hi: "गंभीर वित्तीय धोखाधड़ी! भारत में 'डिजिटल अरेस्ट' नाम का कोई कानून नहीं है। यह पैसे ऐंठने की साजिश है।",
            advice_gu: "તાત્કાલિક ફોન કટ કરો! એક રૂપિયો પણ મોકલશો નહીં. પરિવારજનોને જાણ કરો.",
            advice_hi: "तुरंत फोन डिस्कनेक्ट करें! एक रुपया भी न भेजें और तुरंत अपने परिवार को बताएं।"
          }
        }
      ]
    },
    {
      id: 'scam_fake_kyc',
      title: 'Fake Bank KYC Scam (નકલી બેંક કેવાયસી / फर्जी बैंक केवाईसी)',
      language: 'Gujarati',
      type: 'SCAM',
      duration: '38s',
      audioFile: '/audio/scam_fake_kyc.wav',
      description: 'Caller claims SBI/Bank account will be permanently blocked in 2 hours due to expired KYC; urgently asks for Aadhaar number, debit card details, and SMS OTP.',
      expectedRedFlags: [
        'AUTHORITY_IMPERSONATION',
        'URGENCY',
        'OTP_REQUEST',
        'PERSONAL_DATA',
      ],
      simulationCues: [
        {
          atSecond: 5,
          transcript: "નમસ્કાર સાહેબ, હું સ્ટેટ બેંક ઓફ ઇન્ડિયા (SBI) ના હેડ ઓફિસ કસ્ટમર વેરિફિકેશન ડિપાર્ટમેન્ટમાંથી બોલું છું.",
          result: {
            risk_level: "SUSPICIOUS",
            score: 40,
            red_flags: [
              { type: "AUTHORITY_IMPERSONATION", evidence: "હું સ્ટેટ બેંક ઓફ ઇન્ડિયા (SBI) ના હેડ ઓફિસ વેરિફિકેશન ડિપાર્ટમેન્ટમાંથી બોલું છું." }
            ],
            reason_en: "Caller is impersonating an official from the State Bank of India (SBI) Head Office.",
            advice_en: "Bank officials never call from personal mobile numbers to verify personal accounts.",
            reason_gu: "કોલ કરનાર વ્યક્તિ SBI બેંકના મુખ્ય અધિકારી હોવાનો દાવો કરી રહ્યો છે.",
            reason_hi: "फोन करने वाला व्यक्ति खुद को स्टेट बैंक ऑफ इंडिया का अधिकारी बता रहा है।",
            advice_gu: "સાવચેત રહો. બેંકના અધિકારીઓ ક્યારેય વ્યક્તિગત નંબર પરથી કૉલ કરતા નથી.",
            advice_hi: "सावधान रहें। बैंक अधिकारी कभी पर्सनल नंबर से कॉल नहीं करते।"
          }
        },
        {
          atSecond: 16,
          transcript: "તમારું બેંક એકાઉન્ટ અને એટીએમ કાર્ડ આગામી ૨ કલાકમાં બ્લોક થઈ જશે કારણ કે તમારું કેવાયસી અપડેટ નથી. તાત્કાલિક તમારો આધાર નંબર અને પાન કાર્ડ નંબર આપો.",
          result: {
            risk_level: "SCAM",
            score: 75,
            red_flags: [
              { type: "AUTHORITY_IMPERSONATION", evidence: "SBI હેડ ઓફિસ કસ્ટમર ડિપાર્ટમેન્ટ" },
              { type: "URGENCY", evidence: "આગામી ૨ કલાકમાં તમારું બેંક એકાઉન્ટ અને એટીએમ બ્લોક થઈ જશે" },
              { type: "PERSONAL_DATA", evidence: "તાત્કાલિક તમારો આધાર નંબર અને પાન કાર્ડ નંબર આપો" }
            ],
            reason_en: "Urgent threat of account deactivation used to illegally extract Aadhaar and PAN card details.",
            advice_en: "Do not provide any documents over phone. Visit your local bank branch directly.",
            reason_gu: "બેંક એકાઉન્ટ બ્લોક કરવાની ધમકી આપીને અંગત માહિતી મેળવવાનો આ સ્કેમ છે.",
            reason_hi: "बैंक खाता ब्लॉक करने की झूठी जल्दी दिखाकर निजी दस्तावेज मांगे जा रहे हैं।",
            advice_gu: "કોઈપણ દસ્તાવેજ આપશો નહીં. તમારી નજીકની બેંક શાખામાં જાતે જઈને તપાસ કરો.",
            advice_hi: "कोई जानकारी न दें। सीधे अपनी नजदीकी बैंक शाखा जाकर पता करें।"
          }
        },
        {
          atSecond: 27,
          transcript: "તમારા મોબાઈલ પર ૬ આંકડાનો ઓટીપી (OTP) આવ્યો છે. એકાઉન્ટ ચાલુ રાખવા માટે એ ઓટીપી તાત્કાલિક મને બોલો, નહીંતર પેનલ્ટી લાગશે.",
          result: {
            risk_level: "SCAM",
            score: 99,
            red_flags: [
              { type: "OTP_REQUEST", evidence: "તમારા મોબાઈલ પર ૬ આંકડાનો ઓટીપી (OTP) આવ્યો છે, તાત્કાલિક મને બોલો" },
              { type: "URGENCY", evidence: "તાત્કાલિક બોલો, નહીંતર પેનલ્ટી લાગશે" },
              { type: "AUTHORITY_IMPERSONATION", evidence: "SBI બેંક અધિકારી" }
            ],
            reason_en: "Critical fraud! Demand for a 6-digit SMS OTP is 100% scam. Sharing OTP will immediately siphon your bank funds.",
            advice_en: "Never share OTP with anyone! Contact your bank immediately and dial 1930.",
            reason_gu: "સાવધાન! ઓટીપી (OTP) માંગવો એ ૧૦૦% છેતરપિંડી છે. ઓટીપી આપતાં જ તમારા ખાતામાંથી પૈસા ઉપડી જશે.",
            reason_hi: "अलर्ट! बैंक कभी भी ओटीपी (OTP) नहीं मांगता। ओटीपी बताते ही खाते से पैसे कट जाएंगे।",
            advice_gu: "તરત જ ફોન કાપી નાખો! કોઈને પણ ઓટીપી ક્યારેય ન આપો.",
            advice_hi: "तुरंत फोन काट दें! किसी के साथ ओटीપી साझा न करें।"
          }
        }
      ]
    },
    {
      id: 'scam_courier',
      title: 'Fake Courier Customs Scam (ફેડેક્સ કુરિયર કસ્ટમ્સ / कूरियर कस्टम्स फ्रॉड)',
      language: 'Hinglish',
      type: 'SCAM',
      duration: '40s',
      audioFile: '/audio/scam_courier.wav',
      description: 'Automated voice and fake agent claim a DHL/FedEx courier under victim\'s Aadhaar has illegal foreign currency and narcotics intercepted at Mumbai airport.',
      expectedRedFlags: [
        'AUTHORITY_IMPERSONATION',
        'THREAT_ARREST',
        'URGENCY',
        'MONEY_TRANSFER',
      ],
      simulationCues: [
        {
          atSecond: 6,
          transcript: "This is automated alert from FedEx International Express. Your shipment to Singapore contains illegal contraband. Press 9 to connect with Customs Officer.",
          result: {
            risk_level: "SUSPICIOUS",
            score: 55,
            red_flags: [
              { type: "AUTHORITY_IMPERSONATION", evidence: "FedEx International Express / Customs Officer" }
            ],
            reason_en: "Automated robocall falsely claiming an international shipment contains seized contraband.",
            advice_en: "Legitimate courier companies never connect calls directly to customs officers via IVR.",
            reason_gu: "ઇન્ટરનેશનલ કુરિયર કંપનીના નામે ઓટોમેટેડ ફેક કોલ આવી રહ્યો છે.",
            reason_hi: "फेडेक्स कूरियर के नाम से फर्जी ऑटोमेटेड कॉल की जा रही है।",
            advice_gu: "કુરિયર કંપનીઓ ક્યારેય આ રીતે ફોન કરીને કસ્ટમ્સ અધિકારી સાથે કનેક્ટ નથી કરતી.",
            advice_hi: "कूरियर कंपनियां कभी भी इस तरह कस्टम्स अधिकारी से फोन पर कनेक्ट नहीं करातीं।"
          }
        },
        {
          atSecond: 18,
          transcript: "Hello, Customs Officer Shinde here. Sir, your parcel contains 5 fake passports and 200 grams of synthetic drugs. Anti-Narcotics cell has filed an FIR against you.",
          result: {
            risk_level: "SCAM",
            score: 88,
            red_flags: [
              { type: "AUTHORITY_IMPERSONATION", evidence: "Customs Officer Shinde / Anti-Narcotics cell" },
              { type: "THREAT_ARREST", evidence: "Your parcel contains 5 fake passports and synthetic drugs, FIR filed against you" }
            ],
            reason_en: "False allegations of drug smuggling and forged passports used to intimidate and extort victims.",
            advice_en: "Do not panic or share your Aadhaar details. Real customs authorities send formal physical summons.",
            reason_gu: "કુરિયરમાં ડ્રગ્સ મળ્યા હોવાનો ખોટો આરોપ લગાવીને ડરાવવાનો આ સાયબર ફ્રોડ છે.",
            reason_hi: "पार्सल में नशीले पदार्थ होने का झूठा डर दिखाकर एफआईआर की धमकी दी जा रही है।",
            advice_gu: "ગભરાશો નહીં. તરત જ કૉલ ડિસ્કનેક્ટ કરો અને કોઈ અંગત વિગતો આપશો નહીં.",
            advice_hi: "घबराएं नहीं। तुरंत फोन काटें और कोई व्यक्तिगत जानकारी साझा न करें।"
          }
        },
        {
          atSecond: 30,
          transcript: "To clear your name from the terrorist watch list, you must deposit ₹35,000 clearance fee right now to our government verification UPI ID.",
          result: {
            risk_level: "SCAM",
            score: 99,
            red_flags: [
              { type: "MONEY_TRANSFER", evidence: "Deposit ₹35,000 clearance fee right now to our government verification UPI ID" },
              { type: "URGENCY", evidence: "Right now to clear your name from terrorist list" },
              { type: "THREAT_ARREST", evidence: "Clear your name from terrorist watch list" }
            ],
            reason_en: "Brazen money extortion! Fraudster demands ₹35,000 transfer to an unofficial UPI ID under terrorist threats.",
            advice_en: "Never transfer money to any UPI ID! Report immediately to the National Cyber Crime Helpline at 1930.",
            reason_gu: "સરકારી એકાઉન્ટના નામે UPI ટ્રાન્સફર માંગવામાં આવી રહી છે. આ ૧૦૦% છેતરપિંડી છે.",
            reason_hi: "सरकारी वेरीफिकेशन के नाम पर यूपीआई से पैसे ट्रांसफर करने को कहा जा रहा है। यह फ्रॉड है।",
            advice_gu: "એક પણ રૂપિયો ટ્રાન્સફર કરશો નહીં! તાત્કાલિક ફોન કાપો.",
            advice_hi: "एक भी रुपया ट्रांसफर न करें! फोन तुरंत काट दें।"
          }
        }
      ]
    },
    {
      id: 'fake_scene',
      title: 'Fake Scene (Emergency / Crash Extortion Scam)',
      language: 'English / Hindi',
      type: 'SCAM',
      duration: '38s',
      audioFile: '/audio/fake_scene.wav',
      description: 'Scammer fabricates an emergency car crash and police detention scene, threatening imminent criminal FIR and demanding urgent money transfer.',
      expectedRedFlags: [
        'AUTHORITY_IMPERSONATION',
        'THREAT_ARREST',
        'URGENCY',
        'MONEY_TRANSFER',
        'SECRECY_ISOLATION',
      ],
      simulationCues: [
        {
          atSecond: 4,
          transcript: "Attention! This is an urgent emergency alert. I am calling from the police checkpost and trauma center.",
          result: {
            risk_level: "SUSPICIOUS",
            score: 50,
            red_flags: [
              { type: "AUTHORITY_IMPERSONATION", evidence: "Calling from police checkpost and trauma center" },
              { type: "URGENCY", evidence: "Urgent emergency alert" }
            ],
            reason_en: "Caller fabricates a police emergency scenario to incite immediate fear.",
            advice_en: "Stay calm. Do not trust unknown callers claiming family emergencies.",
            reason_gu: "કોલ કરનાર પોલીસ ચેકપોસ્ટ અને હોસ્પિટલના નામે ડરાવવાનો પ્રયાસ કરે છે.",
            reason_hi: "फोन करने वाला पुलिस और हॉस्पिटल के नाम पर डर पैदा कर रहा है।",
            advice_gu: "શાંત રહો. પહેલા પોતાના પરિવારજનોને સીધો ફોન કરીને તપાસ કરો.",
            advice_hi: "शांत रहें। पहले अपने परिजन को सीधे फोन करके सच्चाई पता करें।"
          }
        },
        {
          atSecond: 16,
          transcript: "Your son was involved in a severe car crash scene and two people are badly injured. The police are filing an immediate criminal FIR against him!",
          result: {
            risk_level: "SCAM",
            score: 85,
            red_flags: [
              { type: "AUTHORITY_IMPERSONATION", evidence: "Police checkpost and trauma center" },
              { type: "THREAT_ARREST", evidence: "Filing an immediate criminal FIR against him" },
              { type: "URGENCY", evidence: "Severe car crash scene, immediate criminal FIR" }
            ],
            reason_en: "Classic 'Fake Scene' emergency scam fabricating family accident and arrest threats.",
            advice_en: "Do not panic! Immediately hang up and call your son or relative directly.",
            reason_gu: "આ ફેક સીન / બોગસ અકસ્માત સ્કેમ છે. પરિવારજનની ધરપકડનો ડર બતાવી પૈસા પડાવવાનો પ્રયાસ છે.",
            reason_hi: "यह 'फेक सीन' इमरजेंसी फ्रॉड है। झूठे एक्सीडेंट का डर दिखाकर वसूली की जा रही है।",
            advice_gu: "ગભરાશો નહીં! ફોન કાપીને તમારા દીકરાને સીધો કોલ કરો.",
            advice_hi: "घबराएं नहीं! तुरंत फोन काटकर अपने बेटे को सीधे कॉल करें।"
          }
        },
        {
          atSecond: 28,
          transcript: "If you want to stop his immediate arrest and start treatment, you must transfer ₹45,000 right now! Do not hang up or call anyone else!",
          result: {
            risk_level: "SCAM",
            score: 98,
            red_flags: [
              { type: "AUTHORITY_IMPERSONATION", evidence: "Police checkpost" },
              { type: "THREAT_ARREST", evidence: "Stop his immediate arrest" },
              { type: "URGENCY", evidence: "Transfer ₹45,000 right now" },
              { type: "MONEY_TRANSFER", evidence: "Transfer ₹45,000 right now to this emergency verification UPI ID" },
              { type: "SECRECY_ISOLATION", evidence: "Do not hang up or call anyone else" }
            ],
            reason_en: "Definite extortion fraud! Caller demands immediate ₹45,000 UPI transfer and commands isolation.",
            advice_en: "Hang up immediately! Never transfer money. Report fraud to Cyber Crime at 1930.",
            reason_gu: "૧૦૦% છેતરપિંડી! તાત્કાલિક UPI દ્વારા ₹૪૫,૦૦૦ માંગવામાં આવે છે અને કોઈને ન જણાવવા દબાણ થાય છે.",
            reason_hi: "100% साइबर वसूली! ₹45,000 यूपीआई ट्रांसफर मांगा जा रहा है और किसी को न बताने का दबाव है।",
            advice_gu: "તાત્કાલિક ફોન કાપી નાખો! ૧ રૂપિયો પણ ન મોકલો.",
            advice_hi: "तुरंत फोन काट दें! एक रुपया भी न भेजें।"
          }
        }
      ]
    },
    {
      id: 'no_scam_call',
      title: 'No Scam Call (Safe Family Conversation)',
      language: 'English',
      type: 'SAFE',
      duration: '30s',
      audioFile: '/audio/no_scam_call.wav',
      description: 'A completely safe, everyday family conversation between mother and adult child with zero scam indicators.',
      expectedRedFlags: [],
      simulationCues: [
        {
          atSecond: 4,
          transcript: "Hello Mom, good morning! How are you doing today? I am calling from the office.",
          result: {
            risk_level: "SAFE",
            score: 0,
            red_flags: [],
            reason_en: "Safe family check-in call from office. Zero threats or fraud indicators.",
            advice_en: "Call is completely safe to continue.",
            reason_gu: "સુરક્ષિત કૌટુંબિક વાતચીત છે. કોઈ જોખમ નથી.",
            reason_hi: "सुरक्षित पारिवारिक बातचीत। कोई खतरा नहीं है।",
            advice_gu: "કૉલ સંપૂર્ણપણે સલામત છે.",
            advice_hi: "कॉल पूरी तरह सुरक्षित है।"
          }
        },
        {
          atSecond: 14,
          transcript: "I wanted to let you know that I will pick up your medicines on my way home this evening. Are you preparing the sweets for the festival this weekend?",
          result: {
            risk_level: "SAFE",
            score: 0,
            red_flags: [],
            reason_en: "Routine conversation about picking up medications and weekend festival sweets.",
            advice_en: "Safe call. No risk detected.",
            reason_gu: "દવાઓ અને તહેવારની સામાન્ય વાતચીત છે. કોઈ શંકાસ્પદ લક્ષણ નથી.",
            reason_hi: "दवाइयों और त्योहार की सामान्य बातचीत। कोई संदिग्ध बात नहीं है।",
            advice_gu: "સુરક્ષિત કૉલ છે (Safe).",
            advice_hi: "सुरक्षित कॉल (Safe)।"
          }
        },
        {
          atSecond: 24,
          transcript: "We will visit you on Sunday afternoon for lunch. Take care of yourself, see you soon!",
          result: {
            risk_level: "SAFE",
            score: 0,
            red_flags: [],
            reason_en: "Family lunch plans confirmed. Zero scam risk.",
            advice_en: "Safe call. Continue normally.",
            reason_gu: "૧૦૦% સુરક્ષિત કૉલ છે. કોઈ જોખમ નથી.",
            reason_hi: "100% सुरक्षित कॉल। कोई खतरा नहीं है।",
            advice_gu: "કોઈપણ ચિંતા વિના વાત કરો.",
            advice_hi: "बिना किसी चिंता के बात जारी रखें।"
          }
        }
      ]
    },
    {
      id: 'genuine_call',
      title: 'Genuine Family Call (No Scam)',
      language: 'Gujarati',
      type: 'SAFE',
      duration: '35s',
      audioFile: '/audio/genuine_call.wav',
      description: 'A genuine, loving Gujarati family conversation between son and mother discussing Diwali sweets (mohanthal and sukhdi), winter groceries, and weekend family visit.',
      expectedRedFlags: [],
      simulationCues: [
        {
          atSecond: 5,
          transcript: "હાય મમ્મી, કેમ છે? તબિયત સારી છે ને? બાપુજીની દવા પૂરી થઈ ગઈ હતી તો હું સાંજે લેતો આવીશ.",
          result: {
            risk_level: "SAFE",
            score: 2,
            red_flags: [],
            reason_en: "This is a genuine, loving family phone call between son and mother discussing health and family medications.",
            advice_en: "Call is completely safe to continue.",
            reason_gu: "આ સંપૂર્ણપણે સુરક્ષિત પરિવારનો ફોન કોલ છે. દીકરો મમ્મી અને બાપુજીની તબિયત અને દવા વિશે પૂછી રહ્યો છે.",
            reason_hi: "यह परिवार का सुरक्षित सामान्य कॉल है। बेटा माता-पिता की सेहत और दवाइयों के बारे में पूछ रहा है।",
            advice_gu: "કોઈપણ ચિંતા કરવાની જરૂર નથી. કૉલ સંપૂર્ણપણે સલામત છે.",
            advice_hi: "कोई चिंता की बात नहीं है। यह कॉल पूरी तरह सुरक्षित है।"
          }
        },
        {
          atSecond: 15,
          transcript: "હા બેટા, બધું સારું છે. દિવાળી માટે સુખડી અને મોહનથાળ બનાવી લીધા છે. તું અને વહુ રવિવારે બપોરે જમવા આવવાના છો ને?",
          result: {
            risk_level: "SAFE",
            score: 1,
            red_flags: [],
            reason_en: "Conversation is about festive sweets (mohanthal and sukhdi) and weekend family lunch. Zero scam patterns.",
            advice_en: "Safe call. No risk detected.",
            reason_gu: "તહેવારની મીઠાઈ અને રવિવારે જમવા આવવાની સ્નેહભરી વાતો થઈ રહી છે. કોઈ શંકાસ્પદ વાત નથી.",
            reason_hi: "त्योहार की मिठाइयों और रविवार को परिवार के साथ भोजन करने की बात हो रही है। कोई संदिग्ध बात नहीं है।",
            advice_gu: "સુરક્ષિત કૉલ છે (Safe). આરામથી વાતચીત ચાલુ રાખો.",
            advice_hi: "सुरक्षित कॉल (Safe)। आराम से बात जारी रखें।"
          }
        },
        {
          atSecond: 26,
          transcript: "ચોક્કસ મમ્મી! અમે રવિવારે સવારે ૧૧ વાગ્યે પહોંચી જઈશું. હું રસ્તામાંથી તાજા ફળો લેતો આવીશ. ધ્યાન રાખજે!",
          result: {
            risk_level: "SAFE",
            score: 0,
            red_flags: [],
            reason_gu: "સામાન્ય કૌટુંબિક વાતચીત છે. કોઈ ધમકી, ઓટીપી કે પૈસાની માંગણી નથી.",
            reason_hi: "सामान्य पारिवारिक बातचीत। कोई धमकी, ओटीपी या पैसे की मांग नहीं है।",
            advice_gu: "૧૦૦% સુરક્ષિત કૉલ છે. કોઈ જોખમ નથી.",
            advice_hi: "100% सुरक्षित कॉल। कोई खतरा नहीं है।"
          }
        }
      ]
    }
  ];

  res.json(demos);
});

// POST /api/generate-tts: Generate multi-speaker audio using gemini-3.8-flash-tts
app.post('/api/generate-tts', async (req, res) => {
  try {
    const ai = getGenAIClient();
    if (!ai) {
      return res.status(401).json({
        error: 'MISSING_API_KEY',
        message: 'GEMINI_API_KEY is not configured.',
      });
    }

    const { script, speaker1Voice = 'Puck', speaker2Voice = 'Kore' } = req.body;

    const response = await ai.models.generateContent({
      model: TTS_MODEL,
      contents: [
        {
          role: 'user',
          parts: [{ text: script }],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              {
                speaker: 'Caller',
                voiceConfig: { prebuiltVoiceConfig: { voiceName: speaker1Voice } },
              },
              {
                speaker: 'Victim',
                voiceConfig: { prebuiltVoiceConfig: { voiceName: speaker2Voice } },
              },
            ],
          },
        },
      },
    });

    const candidates = response.candidates || [];
    const audioPart = candidates[0]?.content?.parts?.find(
      (p) => p.inlineData && p.inlineData.mimeType?.startsWith('audio/')
    );

    if (!audioPart) {
      return res.status(500).json({ error: 'No audio generated by TTS model.' });
    }

    res.json({
      mimeType: audioPart.inlineData.mimeType,
      audioBase64: audioPart.inlineData.data,
    });
  } catch (err) {
    console.error('Error generating TTS:', err);
    res.status(500).json({
      error: 'TTS_GENERATION_FAILED',
      message: err.message || 'Failed to generate TTS audio',
    });
  }
});

// Serve public audio and static assets
const publicPath = path.join(rootDir, 'public');
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
  app.use('/audio', express.static(path.join(publicPath, 'audio')));
}

// Serve static frontend assets in production
const distPath = path.join(rootDir, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get(/(.*)/, (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/audio')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

export const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🛡️  RakshaSetu Scam Shield Server listening on http://0.0.0.0:${PORT}`);
  console.log(`    Cloud Run ready: Port ${PORT}`);
  console.log(`    API Key configured: ${hasValidApiKey()}`);
});

export default app;
