/**
 * Normalizes phone numbers:
 * 1. Converts +84 or (+84) to 0.
 * 2. Strips prefix labels like "M ", "Tel:", "ĐT:", "Mob:", "Cell:", etc.
 * 3. Handles multiple numbers (separated by /, ,, ;, -, newline) and prioritizes Vietnamese mobile numbers (03x, 05x, 07x, 08x, 09x).
 */

export function normalizeSinglePhone(raw: string): string {
  if (!raw) return "";

  // Trim whitespace
  let cleaned = raw.trim();

  // Remove common prefix text labels before numbers (e.g. "M ", "Mob:", "Tel:", "ĐT:", "SĐT:", "Cell:", "P:")
  cleaned = cleaned.replace(/^(?:M(?:obile)?|Tel(?:ephone)?|Cell|Phone|P|T|ĐT|SĐT|Fax)\s*[:.\-]?\s*/i, "");

  // Convert (+84) or +84 at start or after label to 0
  cleaned = cleaned.replace(/\(\+84\)\s*/g, "0");
  cleaned = cleaned.replace(/\+84\s*/g, "0");

  // Also convert 84 at start if followed by mobile/landline digit (e.g. 84983... or 84243...)
  if (/^84[235789]\d{8,9}$/.test(cleaned.replace(/\D/g, ""))) {
    cleaned = "0" + cleaned.replace(/\D/g, "").slice(2);
  }

  // Remove any remaining leading non-digit characters
  cleaned = cleaned.replace(/^[^\d]+/, "");

  return cleaned.trim();
}

export function normalizeAndPrioritizePhone(rawInput: string): string {
  if (!rawInput) return "";

  // Split by common delimiters like /, ,, ;, or newline, or word "và"
  const candidates = rawInput
    .split(/[\n;,/]|(?:\s+v\u00e0\s+)|(?<=\d{8,11})\s*[-|]\s*(?=\d|\+)/i)
    .map(s => normalizeSinglePhone(s))
    .filter(s => s.replace(/\D/g, "").length >= 7);

  if (candidates.length === 0) {
    return normalizeSinglePhone(rawInput);
  }

  // Helper to check if a phone candidate is a Vietnamese mobile number
  // Mobile prefixes: 03, 05, 07, 08, 09 (10 digits)
  const isMobile = (phone: string) => {
    const digitsOnly = phone.replace(/\D/g, "");
    return /^0[35789]\d{8}$/.test(digitsOnly);
  };

  // 1. Find first candidate matching Vietnamese mobile number pattern
  const mobileMatch = candidates.find(c => isMobile(c));
  if (mobileMatch) {
    return mobileMatch;
  }

  // 2. Fallback: Return the first processed candidate
  return candidates[0];
}
