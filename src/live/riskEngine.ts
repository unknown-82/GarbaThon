import { CallRiskReport, RedFlag, RedFlagType, RiskLevel } from '../types/scam';

const CRITICAL_FLAGS: RedFlagType[] = ['OTP_REQUEST', 'MONEY_TRANSFER'];

export class RiskEngine {
  private latchedScam: boolean = false;
  private maxScore: number = 0;
  private allRedFlags: Map<RedFlagType, RedFlag> = new Map();
  private latestReasonGu: string = '';
  private latestReasonHi: string = '';
  private latestAdviceGu: string = '';
  private latestAdviceHi: string = '';

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.latchedScam = false;
    this.maxScore = 0;
    this.allRedFlags.clear();
    this.latestReasonGu = '';
    this.latestReasonHi = '';
    this.latestAdviceGu = '';
    this.latestAdviceHi = '';
  }

  /**
   * Evaluates an incoming chunk report from Gemini against browser-side latching rules.
   *
   * RULES:
   * 1. Flag SCAM only if score >= 70 AND 2+ distinct red flags (or one critical flag like OTP_REQUEST).
   * 2. Once SCAM, it stays SCAM (hysteresis / latching).
   * 3. A genuine call must stay "SAFE" (no false alarms).
   */
  public evaluate(incoming: Partial<CallRiskReport>): CallRiskReport {
    const rawScore = incoming.score ?? 0;
    this.maxScore = Math.max(this.maxScore, rawScore);

    // Merge incoming red flags into accumulated set
    if (incoming.red_flags && Array.isArray(incoming.red_flags)) {
      for (const flag of incoming.red_flags) {
        if (flag && flag.type) {
          // If already recorded, preserve or update with longer/better evidence
          const existing = this.allRedFlags.get(flag.type);
          if (!existing || (flag.evidence && flag.evidence.length > existing.evidence.length)) {
            this.allRedFlags.set(flag.type, flag);
          }
        }
      }
    }

    if (incoming.reason_gu) this.latestReasonGu = incoming.reason_gu;
    if (incoming.reason_hi) this.latestReasonHi = incoming.reason_hi;
    if (incoming.advice_gu) this.latestAdviceGu = incoming.advice_gu;
    if (incoming.advice_hi) this.latestAdviceHi = incoming.advice_hi;

    const distinctFlagsList = Array.from(this.allRedFlags.values());
    const distinctFlagTypes = new Set(distinctFlagsList.map((f) => f.type));
    const hasCriticalFlag = CRITICAL_FLAGS.some((crit) => distinctFlagTypes.has(crit));

    // SCAM Evaluation rule:
    // (score >= 70 AND 2+ distinct flags) OR (1 critical flag like OTP_REQUEST)
    const meetsScamRule =
      (this.maxScore >= 70 && distinctFlagTypes.size >= 2) ||
      hasCriticalFlag ||
      incoming.risk_level === 'SCAM';

    // Latching rule: Once SCAM, it stays SCAM
    if (meetsScamRule || this.latchedScam) {
      this.latchedScam = true;
    }

    let finalRiskLevel: RiskLevel;
    if (this.latchedScam) {
      finalRiskLevel = 'SCAM';
      this.maxScore = Math.max(this.maxScore, 75);
    } else if (this.maxScore >= 40 || distinctFlagTypes.size >= 1) {
      finalRiskLevel = 'SUSPICIOUS';
    } else {
      finalRiskLevel = 'SAFE';
    }

    // Default messages if not provided by Gemini
    const defaultReasonGu =
      finalRiskLevel === 'SCAM'
        ? 'આ કૉલમાં ગંભીર સાયબર છેતરપિંડી અને ધમકીના લક્ષણો જણાયા છે.'
        : finalRiskLevel === 'SUSPICIOUS'
        ? 'આ કૉલમાં કેટલીક શંકાસ્પદ વાતો જણાઈ છે. સાવચેત રહો.'
        : 'આ કૉલ સંપૂર્ણપણે સામાન્ય અને સલામત છે. કોઈ જોખમ નથી.';

    const defaultReasonHi =
      finalRiskLevel === 'SCAM'
        ? 'इस कॉल में गंभीर साइबर धोखाधड़ी और धमकी के संकेत मिले हैं।'
        : finalRiskLevel === 'SUSPICIOUS'
        ? 'इस कॉल में कुछ संदिग्ध बातें पाई गई हैं। सावधान रहें।'
        : 'यह कॉल पूरी तरह सामान्य और सुरक्षित है। कोई खतरा नहीं है।';

    const defaultAdviceGu =
      finalRiskLevel === 'SCAM'
        ? 'તરત જ ફોન કાપી નાખો! કોઈ પૈસા કે ઓટીપી આપશો નહીં.'
        : finalRiskLevel === 'SUSPICIOUS'
        ? 'અજાણી વ્યક્તિને કોઈ અંગત વિગતો આપશો નહીં.'
        : 'કૉલ સુરક્ષિત છે. તમે શાંતિથી વાતચીત ચાલુ રાખી શકો છો.';

    const defaultAdviceHi =
      finalRiskLevel === 'SCAM'
        ? 'तुरंत फोन काट दें! कोई पैसा या ओटीपी साझा न करें।'
        : finalRiskLevel === 'SUSPICIOUS'
        ? 'अंजान कॉलर को कोई व्यक्तिगत जानकारी न दें।'
        : 'कॉल सुरक्षित है। आप शांति से बात जारी रख सकते हैं।';

    return {
      risk_level: finalRiskLevel,
      score: this.maxScore,
      red_flags: distinctFlagsList,
      reason_gu: this.latestReasonGu || defaultReasonGu,
      reason_hi: this.latestReasonHi || defaultReasonHi,
      advice_gu: this.latestAdviceGu || defaultAdviceGu,
      advice_hi: this.latestAdviceHi || defaultAdviceHi,
      evaluatedAt: Date.now(),
    };
  }

  public isScamLatched(): boolean {
    return this.latchedScam;
  }
}
