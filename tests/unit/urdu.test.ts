/**
 * Unit tests for @ahmadiyya-muslim-community-australia/design-tokens Urdu utilities.
 *
 * Tests the shared toUrduNumerals / toAsciiDigits functions used by
 * both the main site (waqfenau.au) and the reports dashboard.
 */

import { describe, it, expect } from 'vitest';
import {
    toUrduNumerals,
    toAsciiDigits,
} from '@ahmadiyya-muslim-community-australia/design-tokens/urdu';

describe('toUrduNumerals', () => {
    it('converts ASCII digits to Urdu numerals', () => {
        expect(toUrduNumerals('2026')).toBe('۲۰۲۶');
    });

    it('handles mixed text and numbers', () => {
        expect(toUrduNumerals('Year 2026')).toBe('Year ۲۰۲۶');
    });

    it('handles multiple numbers in a string', () => {
        expect(toUrduNumerals('Page 5 of 10')).toBe('Page ۵ of ۱۰');
    });

    it('returns empty string for empty input', () => {
        expect(toUrduNumerals('')).toBe('');
    });

    it('preserves non-digit characters', () => {
        expect(toUrduNumerals('Hello! #123')).toBe('Hello! #۱۲۳');
    });

    it('handles decimal numbers', () => {
        expect(toUrduNumerals('3.14')).toBe('۳.۱۴');
    });

    it('converts number type input', () => {
        expect(toUrduNumerals(2026)).toBe('۲۰۲۶');
    });
});

describe('toAsciiDigits', () => {
    it('converts Urdu numerals back to ASCII digits', () => {
        expect(toAsciiDigits('۲۰۲۶')).toBe('2026');
    });

    it('handles mixed text and Urdu numerals', () => {
        expect(toAsciiDigits('Year ۲۰۲۶')).toBe('Year 2026');
    });

    it('returns empty string for empty input', () => {
        expect(toAsciiDigits('')).toBe('');
    });

    it('preserves non-numeral characters', () => {
        expect(toAsciiDigits('Hello! #۱۲۳')).toBe('Hello! #123');
    });
});

describe('round-trip', () => {
    it('toUrduNumerals ∘ toAsciiDigits is identity for ASCII digits', () => {
        const original = '2026';
        expect(toAsciiDigits(toUrduNumerals(original))).toBe(original);
    });

    it('toAsciiDigits ∘ toUrduNumerals is identity for Urdu numerals', () => {
        const original = '۲۰۲۶';
        expect(toUrduNumerals(toAsciiDigits(original))).toBe(original);
    });
});
