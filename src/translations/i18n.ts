import { RedFlagType, RiskLevel, AppLanguage } from '../types/scam';

export interface Translations {
  appTitle: string;
  appSubtitle: string;
  elderMode: string;
  languageLabel: string;
  selectCallPrompt: string;
  selectCallDesc: string;
  playCall: string;
  pauseCall: string;
  restartCall: string;
  liveCallMonitoring: string;
  analyzingLiveStream: string;
  callSafeguardActive: string;
  hangUpCall: string;
  riskMeterTitle: string;
  currentRiskScore: string;
  riskStatus: Record<RiskLevel, string>;
  redFlagsTitle: string;
  noRedFlagsYet: string;
  transcriptTitle: string;
  transcriptListening: string;
  fullScreenAlertHeader: string;
  fullScreenAlertSub: string;
  fullScreenAlertAction: string;
  whyThisIsScam: string;
  whatYouShouldDo: string;
  readAloud: string;
  stopAudioAlert: string;
  connectionMode: string;
  liveApiMode: string;
  fallbackFlashMode: string;
  simulatedDemoMode: string;
  apiSettings: string;
  apiKeyMissingWarning: string;
  redFlagNames: Record<RedFlagType, string>;
  redFlagDescriptions: Record<RedFlagType, string>;
}

export const translations: Record<AppLanguage, Translations> = {
  gu: {
    appTitle: 'રક્ષા સેતુ (RakshaSetu)',
    appSubtitle: 'વડીલો અને ભારતીય નાગરિકો માટે રીયલ-ટાઇમ સ્કેમ કોલ ડિટેક્ટર',
    elderMode: 'મોટા અક્ષરો (વડીલ મોડ)',
    languageLabel: 'ભાષા',
    selectCallPrompt: 'ટેસ્ટ કરવા માટે ફોન કોલ પસંદ કરો:',
    selectCallDesc: 'નીચે આપેલા અવાજો વગાડો. કૉલ ચાલુ હશે ત્યારે જ સિસ્ટમ સ્કેમ પકડી પાડશે.',
    playCall: 'કૉલ શરૂ કરો',
    pauseCall: 'કૉલ થોભાવો',
    restartCall: 'ફરીથી શરૂ કરો',
    liveCallMonitoring: 'કૉલનું જીવંત નિરીક્ષણ ચાલુ છે...',
    analyzingLiveStream: 'જેમિની AI અવાજ સાંભળીને તપાસ કરી રહ્યું છે...',
    callSafeguardActive: 'રક્ષા કવચ સક્રિય છે',
    hangUpCall: 'તાત્કાલિક ફોન કાપો (Hang Up)',
    riskMeterTitle: 'જોખમ મીટર (Risk Meter)',
    currentRiskScore: 'જોખમ સ્કોર:',
    riskStatus: {
      SAFE: 'સંપૂર્ણ સુરક્ષિત (Safe)',
      SUSPICIOUS: 'શંકાસ્પદ વાતચીત (Suspicious)',
      SCAM: 'ખતરનાક છેતરપિંડી! (SCAM ALERT)',
    },
    redFlagsTitle: 'પકડાયેલા જોખમી મુદ્દા (Red Flags):',
    noRedFlagsYet: 'હજુ સુધી કોઈ શંકાસ્પદ લક્ષણ મળ્યું નથી. કૉલ સલામત છે.',
    transcriptTitle: 'લાઈવ વાતચીત (Live Transcript):',
    transcriptListening: 'કૉલ શરૂ કરો... વાતચીતના શબ્દો અહીં લાઈવ લખાશે.',
    fullScreenAlertHeader: '🚨 સાવધાન! આ ૧૦૦% બનાવટી સ્કેમ કૉલ છે!',
    fullScreenAlertSub: 'કોઈપણ સંજોગોમાં પૈસા, ઓટીપી કે આધાર નંબર આપશો નહીં.',
    fullScreenAlertAction: 'તરત જ લાલ બટન દબાવીને ફોન કાપી નાખો!',
    whyThisIsScam: 'આ કૉલ કેમ જોખમી છે?',
    whatYouShouldDo: 'તમારે શું કરવું જોઈએ?',
    readAloud: 'ચેતવણી મોટેથી સાંભળો',
    stopAudioAlert: 'અવાજ બંધ કરો',
    connectionMode: 'જોડાણ પદ્ધતિ:',
    liveApiMode: 'Gemini Live WebSocket API (રીયલ-ટાઇમ)',
    fallbackFlashMode: 'Gemini 3.8 Flash Fallback (રોલિંગ ચંક)',
    simulatedDemoMode: 'ડેમો સિમ્યુલેશન મોડ (ઑફલાઇન સુરક્ષિત)',
    apiSettings: 'API કી સેટિંગ્સ',
    apiKeyMissingWarning: 'GEMINI_API_KEY મળ્યો નથી. ડેમો સિમ્યુલેશન સાથે તમામ સ્કેમ જોઈ શકો છો.',
    redFlagNames: {
      AUTHORITY_IMPERSONATION: 'નકલી અધિકારી (પોલીસ/CBI/બેંક)',
      THREAT_ARREST: 'ધરપકડ અથવા કેસની ધમકી',
      URGENCY: 'ઉતાવળ અને ગભરાવવાનો પ્રયાસ',
      OTP_REQUEST: 'ઓટીપી (OTP) ની માંગણી',
      MONEY_TRANSFER: 'પૈસા ટ્રાન્સફર કરવાનું દબાણ',
      SECRECY_ISOLATION: 'વાત છુપાવવા અને એકલા રહેવાનું દબાણ',
      REMOTE_APP: 'એનીડેસ્ક કે એપ ઇન્સ્ટોલ કરાવવી',
      PERSONAL_DATA: 'આધાર / પાન / બેંક વિગતો માંગવી',
    },
    redFlagDescriptions: {
      AUTHORITY_IMPERSONATION: 'સામેની વ્યક્તિ પોલીસ, સીબીઆઇ અથવા બેંક મેનેજર હોવાનો ખોટો ડોળ કરે છે.',
      THREAT_ARREST: 'ડિજિટલ એરેસ્ટ, જેલ અથવા કેસ કરવાની ગેરકાયદેસર ધમકી આપે છે.',
      URGENCY: 'વિચારવાનો સમય ન મળે તે માટે ૨ કલાકમાં ખાતું બંધ થવાની ઉતાવળ કરાવે છે.',
      OTP_REQUEST: 'બેંક ક્યારેય ઓટીપી નથી માંગતી. ઓટીપી આપતાં જ ખાતું ખાલી થઈ જશે.',
      MONEY_TRANSFER: 'વેરિફિકેશન કે દંડના નામે સરકારી ખાતામાં પૈસા મોકલવા કહે છે.',
      SECRECY_ISOLATION: 'પરિવારના સભ્યોને વાત ન કરવા કે રૂમ બંધ રાખવા કહે છે.',
      REMOTE_APP: 'મોબાઇલનો કંટ્રોલ લેવા AnyDesk અથવા QuickSupport ડાઉનલોડ કરાવે છે.',
      PERSONAL_DATA: 'તમારો આધાર કાર્ડ નંબર, પાન નંબર કે ડેબિટ કાર્ડ નંબર પડાવવાનો પ્રયાસ છે.',
    },
  },
  hi: {
    appTitle: 'रक्षा सेतु (RakshaSetu)',
    appSubtitle: 'भारतीय नागरिकों एवं वरिष्ठ नागरिकों के लिए रियल-टाइम स्कैम कॉल रक्षक',
    elderMode: 'बड़े अक्षर (बुजुर्ग मोड)',
    languageLabel: 'भाषा',
    selectCallPrompt: 'परीक्षण के लिए फोन कॉल चुनें:',
    selectCallDesc: 'नीचे दी गई कॉल चलाएं। कॉल चालू रहने के दौरान ही सिस्टम फ्रॉड पकड़ेगा।',
    playCall: 'कॉल शुरू करें',
    pauseCall: 'कॉल रोकें',
    restartCall: 'पुनः शुरू करें',
    liveCallMonitoring: 'कॉल की लाइव निगरानी जारी है...',
    analyzingLiveStream: 'Gemini AI आवाज सुनकर रियल-टाइम जांच कर रहा है...',
    callSafeguardActive: 'सुरक्षा कवच सक्रिय है',
    hangUpCall: 'तुरंत फोन काटें (Hang Up)',
    riskMeterTitle: 'जोखिम मीटर (Risk Meter)',
    currentRiskScore: 'जोखिम स्कोर:',
    riskStatus: {
      SAFE: 'पूरी तरह सुरक्षित (Safe)',
      SUSPICIOUS: 'संदिग्ध बातचीत (Suspicious)',
      SCAM: 'खतरनाक फ्रॉड कॉल! (SCAM ALERT)',
    },
    redFlagsTitle: 'पकड़े गए खतरे के संकेत (Red Flags):',
    noRedFlagsYet: 'अभी तक कोई संदिग्ध बात नहीं मिली। कॉल सुरक्षित है।',
    transcriptTitle: 'लाइव बातचीत (Live Transcript):',
    transcriptListening: 'कॉल शुरू करें... बोले गए शब्द यहाँ लाइव दिखेंगे।',
    fullScreenAlertHeader: '🚨 सावधान! यह 100% फर्जी स्कैम कॉल है!',
    fullScreenAlertSub: 'किसी भी हालत में पैसे, ओटीपी या आधार नंबर न दें।',
    fullScreenAlertAction: 'तुरंत लाल बटन दबाकर फोन काट दें!',
    whyThisIsScam: 'यह कॉल क्यों खतरनाक है?',
    whatYouShouldDo: 'आपको क्या करना चाहिए?',
    readAloud: 'चेतावनी बोलकर सुनाएं',
    stopAudioAlert: 'आवाज बंद करें',
    connectionMode: 'कनेक्शन मोड:',
    liveApiMode: 'Gemini Live WebSocket API (रियल-टाइम)',
    fallbackFlashMode: 'Gemini 3.8 Flash Fallback (रोलिंग चंक)',
    simulatedDemoMode: 'डेमो सिमुलेशन मोड (ऑफ़लाइन सुरक्षित)',
    apiSettings: 'API की सेटिंग्स',
    apiKeyMissingWarning: 'GEMINI_API_KEY नहीं मिला। डेमो सिमुलेशन से सभी फ्रॉड का लाइव टेस्ट देख सकते हैं।',
    redFlagNames: {
      AUTHORITY_IMPERSONATION: 'फर्जी अधिकारी (पुलिस/CBI/बैंक)',
      THREAT_ARREST: 'गिरफ्तारी या वारंट की धमकी',
      URGENCY: 'जल्दबाजी और डराने की कोशिश',
      OTP_REQUEST: 'ओटीपी (OTP) की मांग',
      MONEY_TRANSFER: 'पैसे ट्रांसफर करने का दबाव',
      SECRECY_ISOLATION: 'बात छुपाने और कमरे में बंद रहने का दबाव',
      REMOTE_APP: 'एनीडेस्क या रिमोट ऐप डाउनलोड कराना',
      PERSONAL_DATA: 'आधार / पैन / बैंक विवरण मांगना',
    },
    redFlagDescriptions: {
      AUTHORITY_IMPERSONATION: 'कॉलर खुद को पुलिस, सीबीआई, या बैंक का बड़ा अफसर बता रहा है।',
      THREAT_ARREST: 'डिजिटल अरेस्ट या गैर-जमानती वारंट का झूठा डर दिखा रहा है।',
      URGENCY: 'सोचने का मौका न मिले इसलिए 2 घंटे में खाता बंद होने की जल्दी मचा रहा है।',
      OTP_REQUEST: 'बैंक कभी ओटीपी नहीं मांगता। ओटीपी देते ही खाता खाली हो जाएगा।',
      MONEY_TRANSFER: 'सरकारी वेरीफिकेशन के नाम पर किसी खाते में पैसे डालने को कह रहा है।',
      SECRECY_ISOLATION: 'घरवालों से बात न करने और कमरा बंद रखने का दबाव बना रहा है।',
      REMOTE_APP: 'फोन का पूरा नियंत्रण पाने के लिए AnyDesk या TeamViewer डलवा रहा है।',
      PERSONAL_DATA: 'आपका आधार, पैन या एटीएम कार्ड नंबर चुराने की कोशिश है।',
    },
  },
  en: {
    appTitle: 'RakshaSetu',
    appSubtitle: 'Real-time Scam Call Detector for Indian Elders powered by Google Gemini Live API',
    elderMode: 'Large Text (Elder Mode)',
    languageLabel: 'Language',
    selectCallPrompt: 'Select a phone call to test:',
    selectCallDesc: 'Play audio below. While playing, Gemini listens and detects scam patterns in real time.',
    playCall: 'Play Call',
    pauseCall: 'Pause Call',
    restartCall: 'Restart Call',
    liveCallMonitoring: 'Live Call Monitoring Active...',
    analyzingLiveStream: 'Gemini AI is analyzing incoming audio stream...',
    callSafeguardActive: 'Protection Shield Active',
    hangUpCall: 'Disconnect Call (Hang Up)',
    riskMeterTitle: 'Risk Meter',
    currentRiskScore: 'Risk Score:',
    riskStatus: {
      SAFE: 'Completely Safe',
      SUSPICIOUS: 'Suspicious Activity',
      SCAM: 'CONFIRMED SCAM ALERT!',
    },
    redFlagsTitle: 'Detected Red Flags:',
    noRedFlagsYet: 'No suspicious patterns detected yet. Call is safe.',
    transcriptTitle: 'Live Call Transcript:',
    transcriptListening: 'Start call... Live speech-to-text transcript will appear here.',
    fullScreenAlertHeader: '🚨 DANGER! Confirmed Scam Call Detected!',
    fullScreenAlertSub: 'Do NOT share OTP, bank details, or transfer any money.',
    fullScreenAlertAction: 'Hang up the phone immediately!',
    whyThisIsScam: 'Why is this call dangerous?',
    whatYouShouldDo: 'Action Required:',
    readAloud: 'Speak Warning Aloud',
    stopAudioAlert: 'Mute Voice Alert',
    connectionMode: 'Engine Mode:',
    liveApiMode: 'Gemini Live WebSocket API (Real-Time)',
    fallbackFlashMode: 'Gemini 3.8 Flash Fallback (Rolling Chunks)',
    simulatedDemoMode: 'Demo Simulation Mode (Offline Safe)',
    apiSettings: 'API Settings',
    apiKeyMissingWarning: 'No GEMINI_API_KEY detected in .env. Pre-recorded demonstration simulation is active.',
    redFlagNames: {
      AUTHORITY_IMPERSONATION: 'Authority Impersonation (Police/CBI/Bank)',
      THREAT_ARREST: 'Arrest / Legal Threat ("Digital Arrest")',
      URGENCY: 'Artificial Urgency & Panic',
      OTP_REQUEST: 'OTP / Security PIN Demanded',
      MONEY_TRANSFER: 'Money Transfer / Penalty Demand',
      SECRECY_ISOLATION: 'Secrecy & Isolation Coercion',
      REMOTE_APP: 'Remote Access App (AnyDesk/TeamViewer)',
      PERSONAL_DATA: 'Aadhaar / PAN / Sensitive Info Demand',
    },
    redFlagDescriptions: {
      AUTHORITY_IMPERSONATION: 'Caller falsely claims to be a police officer, CBI, or bank official.',
      THREAT_ARREST: 'Threatens immediate arrest warrant or fake "digital arrest" detention.',
      URGENCY: 'Forces panic with strict deadlines like account freezing in 2 hours.',
      OTP_REQUEST: 'Demands one-time password (OTP). Financial institutions never request OTPs.',
      MONEY_TRANSFER: 'Demands fund transfer into "verification" or "clearance" accounts.',
      SECRECY_ISOLATION: 'Pressures victim to keep call secret and isolate themselves.',
      REMOTE_APP: 'Instructs victim to install remote device controlling software.',
      PERSONAL_DATA: 'Extracts Aadhaar, PAN card, or debit card credentials.',
    },
  },
};
