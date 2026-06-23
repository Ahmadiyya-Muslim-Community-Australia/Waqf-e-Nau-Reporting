/**
 * Unit tests for the bilingual translation dictionary.
 *
 * Tests the lookup function and verifies all keys have both
 * English and Urdu translations.
 */

import { describe, it, expect } from 'vitest';
import { lookup, NAV, DASHBOARD, TAJNEED, COLUMNS, UI } from '../../src/i18n/translations';

describe('lookup', () => {
    it('returns English string for existing key', () => {
        expect(lookup('dashboard', 'en')).toBe('Dashboard');
    });

    it('returns Urdu string for existing key', () => {
        expect(lookup('dashboard', 'ur')).toBe('ڈیش بورڈ');
    });

    it('falls back to key when translation not found', () => {
        expect(lookup('nonexistent_key', 'en')).toBe('nonexistent_key');
    });

    it('falls back to key for missing language', () => {
        expect(lookup('dashboard', 'fr' as 'en')).toBe('dashboard');
    });
});

describe('NAV dictionary', () => {
    it('has valid entries', () => {
        for (const [key, val] of Object.entries(NAV)) {
            expect(val.en).toBeTruthy();
            expect(val.ur).toBeTruthy();
            expect(typeof val.en).toBe('string');
            expect(typeof val.ur).toBe('string');
        }
    });
});

describe('DASHBOARD dictionary', () => {
    it('has valid entries', () => {
        for (const [key, val] of Object.entries(DASHBOARD)) {
            expect(val.en).toBeTruthy();
            expect(val.ur).toBeTruthy();
        }
    });
});

describe('TAJNEED dictionary', () => {
    it('has valid entries', () => {
        for (const [key, val] of Object.entries(TAJNEED)) {
            expect(val.en).toBeTruthy();
            expect(val.ur).toBeTruthy();
        }
    });
});

describe('COLUMNS dictionary', () => {
    it('has valid entries', () => {
        for (const [key, val] of Object.entries(COLUMNS)) {
            expect(val.en).toBeTruthy();
            expect(val.ur).toBeTruthy();
        }
    });
});

describe('UI dictionary', () => {
    it('has valid entries', () => {
        for (const [key, val] of Object.entries(UI)) {
            expect(val.en).toBeTruthy();
            expect(val.ur).toBeTruthy();
        }
    });

    it('includes recently added keys', () => {
        expect(UI.restrictedAccess).toBeDefined();
        expect(UI.restrictedAccess.en).toBe('Restricted Access');
        expect(UI.restrictedAccess.ur).toBe('محدود رسائی');
        expect(UI.requiredPermission).toBeDefined();
    });
});
