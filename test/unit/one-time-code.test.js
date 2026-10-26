import { describe, expect, it } from 'vitest';
import { extractOneTimeCode } from '../../src/shared/one-time-code.js';

describe('extractOneTimeCode', () => {
  it('extracts a code that follows a verification keyword', () => {
    expect(extractOneTimeCode('Your verification code is 482913. Do not share it.')).toBe('482913');
  });

  it('extracts Hebrew verification messages', () => {
    expect(extractOneTimeCode('קוד האימות שלך לכניסה: 323447')).toBe('323447');
  });

  it('prefers the domain-bound code and needs no keyword for it', () => {
    expect(extractOneTimeCode('123456 warroom.example.com #654321@')).toBe('654321');
  });

  it('normalizes 3-3 hyphenated codes', () => {
    expect(extractOneTimeCode('Your OTP: 123-456')).toBe('123456');
  });

  it('ignores digits without a code keyword', () => {
    expect(extractOneTimeCode('See you at 4567 Main Street')).toBeNull();
  });

  it('ignores phone numbers and too-short or too-long digit runs', () => {
    expect(extractOneTimeCode('Your code: call 0529995811 or 123 or 123456789')).toBeNull();
  });

  it('returns null when a keyword has no digits', () => {
    expect(extractOneTimeCode('Use the code from the app')).toBeNull();
  });
});
