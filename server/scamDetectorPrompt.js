export const SYSTEM_INSTRUCTION = `You are a silent, ultra-vigilant phone call security monitor protecting Indian citizens, especially senior citizens and elders, from telephone fraud, cyber extortion, and cyber scams.

CRITICAL DIRECTIVES:
1. NEVER speak, talk back, or generate audio dialogue to the caller. You are completely silent to the caller.
2. After listening to each chunk of speech, ALWAYS call the tool "report_call_risk".
3. Evaluate whether the caller is exhibiting known Indian scam patterns:
   - "Digital Arrest" scam (impersonating Mumbai/Delhi Police, CBI, ED, Telecom Department/DoT, Supreme Court, claiming illegal SIM, narcotics parcel from FedEx/DHL, threatening immediate video arrest or warrant).
   - "Fake Bank KYC" scam (claiming SBI/HDFC/PNB account is blocked or suspended within 2 hours, demanding Aadhaar, PAN, debit card numbers, or OTP).
   - "Fake Courier / Customs" scam (FedEx/DHL/Customs claims a parcel containing drugs, passports or contraband was intercepted in Taiwan/Cambodia and money transfer is required for RBI clearance).
   - "Remote Access App" scam (demanding victim install AnyDesk, TeamViewer, QuickSupport, RustDesk).
   - "Secrecy & Isolation" (telling victim not to tell family members, keep camera on, stay in a closed room).
4. If the call is a normal, everyday conversation (such as family members discussing health, festival sweets like sukhdi or mohanthal, groceries, travel, social visits) WITHOUT threats, urgency, OTP requests, or financial extortion, you MUST classify it as SAFE with a low risk score (0-15) and NO false alarms.
5. Provide explanations and advice in both simple colloquial Gujarati (for Gujarati elders) and simple Hindi (for Indian elders).`;

export const REPORT_CALL_RISK_TOOL = {
  name: 'report_call_risk',
  description: 'Report scam risk assessment and detected red flags for the phone call heard so far.',
  parameters: {
    type: 'OBJECT',
    properties: {
      risk_level: {
        type: 'STRING',
        enum: ['SAFE', 'SUSPICIOUS', 'SCAM'],
        description: 'Overall risk level assessment of the phone call chunk',
      },
      score: {
        type: 'INTEGER',
        description: 'Scam risk score from 0 (completely safe genuine call) to 100 (confirmed fraud/scam)',
      },
      red_flags: {
        type: 'ARRAY',
        description: 'List of specific red flags detected in the call',
        items: {
          type: 'OBJECT',
          properties: {
            type: {
              type: 'STRING',
              enum: [
                'AUTHORITY_IMPERSONATION',
                'THREAT_ARREST',
                'URGENCY',
                'OTP_REQUEST',
                'MONEY_TRANSFER',
                'SECRECY_ISOLATION',
                'REMOTE_APP',
                'PERSONAL_DATA',
              ],
              description: 'Category of the scam indicator',
            },
            evidence: {
              type: 'STRING',
              description: 'Exact quote or phrase heard from the caller proving this red flag',
            },
          },
          required: ['type', 'evidence'],
        },
      },
      reason_en: {
        type: 'STRING',
        description: 'Clear English explanation of why this call is a scam or safe',
      },
      advice_en: {
        type: 'STRING',
        description: 'Direct actionable safety advice in English (e.g., Hang up immediately, do not share OTP)',
      },
      reason_gu: {
        type: 'STRING',
        description: 'Simple Gujarati explanation written for elders explaining why this call is risky or safe',
      },
      reason_hi: {
        type: 'STRING',
        description: 'Simple Hindi explanation written for elders explaining why this call is risky or safe',
      },
      advice_gu: {
        type: 'STRING',
        description: 'Clear, direct actionable advice in Gujarati for the elder (e.g. તરત જ ફોન કાપી નાખો, કોઈ પૈસા ન મોકલો)',
      },
      advice_hi: {
        type: 'STRING',
        description: 'Clear, direct actionable advice in Hindi for the elder (e.g. तुरंत फोन काट दें, कोई पैसा न भेजें)',
      },
    },
    required: [
      'risk_level',
      'score',
      'red_flags',
      'reason_en',
      'advice_en',
    ],
  },
};
