import { describe, expect, it } from 'vitest';
import { extractOneTimeCode } from '../../src/shared/one-time-code.js';

describe('extractOneTimeCode', () => {
  it.each([
    ['Your verification code is 482913. Do not share it.', '482913'],
    ['קוד האימות שלך לכניסה: 323447', '323447'],
    ['123456 :קוד', '123456'],
    ['Your OTP: 123-456', '123456'],
    ['482913 is your verification code', '482913'],
    ['Your code is 1234', '1234'],
    ['Your code is 12345678', '12345678'],
    ['Your code is 12345', '12345'],
    ['Your code is 1234567', '1234567'],
    ['G-123456 is your Google verification code', '123456']
  ])('extracts the code from %j', (text, expected) => {
    expect(extractOneTimeCode(text)).toBe(expected);
  });

  it.each([
    ['#654321@'],
    ['warroom.example.com #654321@'],
    ['@example.com #654321'],
    ['@example.com #654321 @example.com']
  ])('extracts a domain-bound code without a keyword from %j', (text) => {
    expect(extractOneTimeCode(text)).toBe('654321');
  });

  it('prefers the domain-bound code over a keyword-gated code', () => {
    expect(extractOneTimeCode('Your code 111111 @example.com #222222')).toBe('222222');
  });

  it.each([
    ['#123@'],
    ['#123456789@'],
    ['#654321 on its own'],
    ['@example.com #123']
  ])('ignores malformed domain-bound input %j', (text) => {
    expect(extractOneTimeCode(text)).toBeNull();
  });

  it('prefers the number after the keyword over earlier numbers', () => {
    expect(extractOneTimeCode('Order 12345 shipped. Your verification code is 678901'))
      .toBe('678901');
    expect(extractOneTimeCode('Charge of 2500 NIS. Your code: 482913')).toBe('482913');
  });

  it('picks the nearest number after the keyword', () => {
    expect(extractOneTimeCode('Your code is 111111 or 222222')).toBe('111111');
  });

  it('picks the nearest number before the keyword when none follow it', () => {
    expect(extractOneTimeCode('Ref 11111 and 222222 is your code')).toBe('222222');
  });

  it('ignores numbers that are too far from the keyword', () => {
    expect(extractOneTimeCode(`Code ${'x'.repeat(70)} 123456`)).toBeNull();
    expect(extractOneTimeCode(`123456 ${'x'.repeat(70)} code`)).toBeNull();
  });

  it.each([
    ['See you at 4567 Main Street'],
    ['Use the code from the app'],
    ['Your zipcode is 90210'],
    ['Your package to zip code 94105 arrives today'],
    ['Promo code 123456 saves 10%'],
    ['Social Security reminder 4521'],
    ['Security alert, call 555-123-4567'],
    ['Call 800-555-1234, your code'],
    ['Your code: call 0529995811'],
    ['Your code is 123'],
    ['Your code is 123456789'],
    ['Your code is 1234-56'],
    ['Your code is 12-3456'],
    ['Your code is 123-45']
  ])('returns null for %j', (text) => {
    expect(extractOneTimeCode(text)).toBeNull();
  });

  it('still finds the code when a phone number is also present', () => {
    expect(extractOneTimeCode('Call 800-555-1234, your code 482913')).toBe('482913');
  });
});
