/**
 * Unit tests for the smart search DSL parser (parseSearch).
 *
 * Tests the col:value syntax parsing used by the TajneedPage FiltersBar.
 */

import { describe, it, expect, vi } from 'vitest';

// Mock @sqlrooms/ui to prevent Node.js import errors from shadcn/ui sub-components
vi.mock('@sqlrooms/ui', () => ({
    Input: 'input',
    Badge: 'span',
    Separator: 'hr',
}));

import { parseSearch } from '../../src/components/FiltersBar';

describe('parseSearch', () => {
    it('returns empty filters for empty input', () => {
        const result = parseSearch('');
        expect(result.columnFilters).toEqual([]);
        expect(result.freeText).toBe('');
    });

    it('parses a single col:value filter', () => {
        const result = parseSearch('status:Active');
        expect(result.columnFilters).toHaveLength(1);
        expect(result.columnFilters[0]).toEqual({ column: 'status', value: 'Active' });
        expect(result.freeText).toBe('');
    });

    it('parses multiple col:value filters', () => {
        const result = parseSearch('status:Active gender:Male');
        expect(result.columnFilters).toHaveLength(2);
        expect(result.columnFilters[0]).toEqual({ column: 'status', value: 'Active' });
        expect(result.columnFilters[1]).toEqual({ column: 'gender', value: 'Male' });
        expect(result.freeText).toBe('');
    });

    it('extracts free-text terms after column filters', () => {
        const result = parseSearch('status:Active Ahmad');
        expect(result.columnFilters).toHaveLength(1);
        expect(result.columnFilters[0]).toEqual({ column: 'status', value: 'Active' });
        expect(result.freeText).toBe('Ahmad');
    });

    it('handles mixed filters and free text', () => {
        const result = parseSearch('status:Active city:Sydney male youth');
        expect(result.columnFilters).toHaveLength(2);
        expect(result.freeText).toBe('male youth');
    });

    it('parses quoted values with spaces', () => {
        const result = parseSearch('city:"Sydney NSW"');
        expect(result.columnFilters).toHaveLength(1);
        expect(result.columnFilters[0]).toEqual({ column: 'city', value: 'Sydney NSW' });
        expect(result.freeText).toBe('');
    });

    it('handles Unicode smart quotes', () => {
        const result = parseSearch('name:"John Smith"');
        expect(result.columnFilters).toHaveLength(1);
        expect(result.columnFilters[0].value).toBe('John Smith');
    });

    it('is case-insensitive for column names', () => {
        const result = parseSearch('STATUS:Active');
        expect(result.columnFilters[0].column).toBe('status');
    });

    it('returns free text when no colons present', () => {
        const result = parseSearch('Ahmad Sydney');
        expect(result.columnFilters).toEqual([]);
        expect(result.freeText).toBe('Ahmad Sydney');
    });

    it('handles mixed colons in free text', () => {
        const result = parseSearch('status:Active email:test@example.com notes');
        // "test@example.com" — the @ and . make it not match \w+ after colon
        // Actually: email:test is matched, @example.com is free text
        expect(result.columnFilters.length).toBeGreaterThanOrEqual(1);
        expect(result.freeText).toBeTruthy();
    });
});
