const MAX_KEYWORD_DISTANCE = 60;
const OTP_KEYWORD_PATTERN =
  /\b(?:code|otp|passcode|password|verification|verify|one[-\s]?time|pin|authentication)\b|קוד|סיסמ|אימות/giu;
const NON_OTP_CODE_PATTERN =
  /\b(?:zip|postal|post|promo|promotion|area|country|bar|discount|coupon|gift|tracking|product|source|dress)\s+codes?\b/giu;
const DOMAIN_BOUND_CODE_PATTERNS = [
  /#(\d{4,8})@/u,
  /@[\w.-]+\s+#(\d{4,8})\b/u
];
const CODE_CANDIDATE_PATTERN = /(?<!\d)(?<!\d-)(\d{3}-\d{3}(?![\d-])|\d{4,8}(?![\d-]))(?!\d)/gu;

function blankOut(text, pattern) {
  return text.replace(pattern, (match) => ' '.repeat(match.length));
}

function getKeywordRanges(text) {
  return Array.from(text.matchAll(OTP_KEYWORD_PATTERN), (match) => ({
    start: match.index,
    end: match.index + match[0].length
  }));
}

function rankCandidate(candidate, keywordRanges) {
  const candidateEnd = candidate.index + candidate.code.length;
  let best = null;

  for (const { start, end } of keywordRanges) {
    const isAfter = candidate.index >= end;
    const distance = isAfter ? candidate.index - end : start - candidateEnd;

    if (
      (isAfter || candidateEnd <= start)
      && distance <= MAX_KEYWORD_DISTANCE
      && (!best || (isAfter && best.isBefore) || (isAfter === !best.isBefore && distance < best.distance))
    ) {
      best = { isBefore: !isAfter, distance };
    }
  }

  return best;
}

export function extractOneTimeCode(text) {
  for (const pattern of DOMAIN_BOUND_CODE_PATTERNS) {
    const domainBoundMatch = pattern.exec(text);

    if (domainBoundMatch) {
      return domainBoundMatch[1];
    }
  }

  const searchableText = blankOut(text, NON_OTP_CODE_PATTERN);
  const keywordRanges = getKeywordRanges(searchableText);
  const ranked = Array.from(searchableText.matchAll(CODE_CANDIDATE_PATTERN), (match) => ({
    index: match.index,
    code: match[1]
  }))
    .map((candidate) => ({ candidate, rank: rankCandidate(candidate, keywordRanges) }))
    .filter(({ rank }) => rank !== null)
    .sort((left, right) => (
      Number(left.rank.isBefore) - Number(right.rank.isBefore)
      || left.rank.distance - right.rank.distance
    ));

  return ranked.length > 0 ? ranked[0].candidate.code.replace('-', '') : null;
}
