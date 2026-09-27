export interface GuardrailScanResult {
  isFlagged: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  matchedPatterns: string[];
  sanitizedInput: string;
}

const INJECTION_PATTERNS: Array<{ category: string; regex: RegExp }> = [
  // Instruction Overrides & Jailbreaks
  { category: 'INSTRUCTION_OVERRIDE', regex: /(?:ignore|disregard|forget|bypass)\s+(?:all\s+)?(?:previous|prior|above|store)\s+(?:rules|instructions|prompts|policies)/i },
  { category: 'SYSTEM_OVERRIDE', regex: /system\s+override(?:\s*[:\-]|(?:\s+to|\s+mode))/i },
  { category: 'DEV_MODE', regex: /(?:developer\s+mode|jailbreak|unrestricted\s+mode|dan\s+mode)/i },
  { category: 'RESET_PROMPT', regex: /(?:reset|erase|clear)\s+(?:your\s+)?(?:context|instructions|memory)/i },

  // Role Inversion / Impersonation
  { category: 'ROLE_IMPERSONATION', regex: /i\s+am\s+(?:the\s+)?(?:ceo|admin|administrator|executive|director|supervisor|owner|developer|engineer|worknoon\s+staff)/i },
  { category: 'AUTHORIZE_OVERRIDE', regex: /(?:authorize|mandate|force)\s+(?:this\s+)?(?:override|refund|approval)/i },
  { category: 'ROLE_PROMPT', regex: /(?:you\s+are\s+now|act\s+as\s+a|pretend\s+you\s+are)\s+(?:an?\s+unrestricted|a\s+bot\s+that\s+always\s+approves)/i },

  // Delimiter & Tag Spoofing
  { category: 'DELIMITER_SPOOF', regex: /```(?:system|json|instructions|prompt)?|<\/?(?:system|instructions|admin|context|user|assistant)>/i },

  // Prompt / Secret Leaks
  { category: 'PROMPT_LEAK', regex: /(?:reveal|print|output|show|display|repeat)\s+(?:your\s+)?(?:system\s+prompt|initial\s+prompt|guidelines|hidden\s+rules|api\s*key)/i },

  // Coercive Directives
  { category: 'FORCED_DIRECTIVE', regex: /(?:you\s+must\s+approve|immediately\s+issue\s+(?:a\s+)?(?:full\s+)?refund|bypass\s+all\s+checks)/i }
];

/**
 * True when a message is genuinely unintelligible gibberish, whitespace, or spam.
 * Normal conversational greetings ("hey", "hello") or product questions must NOT be blocked.
 */
export function isUnintelligible(input: string): boolean {
  if (!input || typeof input !== 'string') return true;
  const trimmed = input.trim();
  if (trimmed.length === 0) return true;
  if (!/\S/.test(trimmed)) return true;
  // Repetitive character spam (e.g. 'aaaaaa', '!!!!!!')
  if (/(.)\1{5,}/.test(trimmed)) return true;
  // Giant single token without spaces (e.g. keyboard smash)
  if (!/\s/.test(trimmed) && trimmed.length > 35) return true;
  // Keyboard smash of pure symbols
  if (/^[^a-zA-Z0-9\s]+$/.test(trimmed) && trimmed.length > 4) return true;
  return false;
}

export function scanForPromptInjection(input: string): GuardrailScanResult {
  if (!input || typeof input !== 'string') {
    return {
      isFlagged: false,
      riskLevel: 'LOW',
      matchedPatterns: [],
      sanitizedInput: ''
    };
  }

  // 1. Sanitize input: remove null bytes, non-printable control characters (except newline/tab), collapse whitespace
  const sanitized = input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // 2. Scan for matched patterns
  const matchedPatterns: string[] = [];

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.regex.test(sanitized)) {
      matchedPatterns.push(pattern.category);
    }
  }

  const isFlagged = matchedPatterns.length > 0;
  const riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = isFlagged ? 'HIGH' : 'LOW';

  return {
    isFlagged,
    riskLevel,
    matchedPatterns,
    sanitizedInput: sanitized
  };
}
