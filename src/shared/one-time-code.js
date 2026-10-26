const OTP_KEYWORD_PATTERN =
  /code|otp|passcode|password|verif|one[-\s]?time|\bpin\b|authenticat|security|קוד|סיסמ|אימות/i;
const DOMAIN_BOUND_CODE_PATTERN = /#(\d{4,8})@/;
const CODE_PATTERN = /(?<!\d)(\d{3}-\d{3}|\d{4,8})(?!\d)/;

export function extractOneTimeCode(text) {
  const domainBoundMatch = DOMAIN_BOUND_CODE_PATTERN.exec(text);

  if (domainBoundMatch) {
    return domainBoundMatch[1];
  }

  if (!OTP_KEYWORD_PATTERN.test(text)) {
    return null;
  }

  const codeMatch = CODE_PATTERN.exec(text);

  return codeMatch ? codeMatch[1].replace('-', '') : null;
}
