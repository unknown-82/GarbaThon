export type RiskLevel = 'SAFE' | 'SUSPICIOUS' | 'SCAM';

export type RedFlagType =
  | 'AUTHORITY_IMPERSONATION'
  | 'THREAT_ARREST'
  | 'URGENCY'
  | 'OTP_REQUEST'
  | 'MONEY_TRANSFER'
  | 'SECRECY_ISOLATION'
  | 'REMOTE_APP'
  | 'PERSONAL_DATA';

export interface RedFlag {
  type: RedFlagType;
  evidence: string;
}

export interface CallRiskReport {
  risk_level: RiskLevel;
  score: number;
  red_flags: RedFlag[];
  reason_gu: string;
  reason_hi: string;
  advice_gu: string;
  advice_hi: string;
  evaluatedAt?: number;
  sourceChunk?: number;
}

export interface DemoCallCue {
  atSecond: number;
  transcript: string;
  result: CallRiskReport;
}

export interface DemoCall {
  id: string;
  title: string;
  language: string;
  type: 'SCAM' | 'SAFE';
  duration: string;
  audioFile: string;
  description: string;
  expectedRedFlags: RedFlagType[];
  simulationCues?: DemoCallCue[];
}

export type AppLanguage = 'gu' | 'hi' | 'en';

export interface LiveConnectionStatus {
  state: 'idle' | 'connecting' | 'connected' | 'analyzing' | 'error' | 'disconnected';
  mode: 'live_api' | 'fallback_flash' | 'simulation';
  error?: string;
  modelName?: string;
}
