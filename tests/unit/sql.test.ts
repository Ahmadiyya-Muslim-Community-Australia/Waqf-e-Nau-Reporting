import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { escapeLike, escapeSql, injectJamaatFilter, buildJamaatClause } from '../../src/lib/sql';

describe('escapeLike', () => {
    it('should not modify strings without special characters', () => {
        fc.assert(
            fc.property(fc.stringMatching(/^[a-zA-Z0-9\s]+$/), (input) => {
                return escapeLike(input) === input;
            }),
        );
    });

    it('should escape every percent, underscore, and single-quote', () => {
        fc.assert(
            fc.property(fc.array(fc.constantFrom('%', '_', "'", 'a', 'b', ' ')), (chars) => {
                const input = chars.join('');
                const result = escapeLike(input);
                const expectedEscapes = input.replace(/[%_']/g, '\\$&');
                return result === expectedEscapes;
            }),
        );
    });
});

describe('escapeSql', () => {
    it('should double every single quote', () => {
        fc.assert(
            fc.property(fc.string(), (input) => {
                const result = escapeSql(input);
                const originalQuotes = (input.match(/'/g) ?? []).length;
                const resultQuotes = (result.match(/'/g) ?? []).length;
                return resultQuotes === originalQuotes * 2;
            }),
        );
    });

    it('should not modify strings without quotes', () => {
        fc.assert(
            fc.property(fc.stringMatching(/^[a-zA-Z0-9\s]*$/), (input) => {
                return escapeSql(input) === input;
            }),
        );
    });
});

describe('buildJamaatClause', () => {
    it('should return empty string for null filter', () => {
        expect(buildJamaatClause(null)).toBe('');
    });

    it('should return empty string for filter with empty jamat_id', () => {
        expect(buildJamaatClause({ jamat_id: '' })).toBe('');
    });

    it('should build an IN clause with name, label, and aliases', () => {
        const clause = buildJamaatClause({ jamat_id: 'nsw-marsden-park' });
        expect(clause).toBe("jamaat IN ('Marsden Park', 'NSW: Marsden Park', 'Sydney')");
    });

    it('should fall back to equality for unknown jamaat IDs', () => {
        const clause = buildJamaatClause({ jamat_id: 'unknown-id' });
        expect(clause).toBe("jamaat = 'unknown-id'");
    });

    it('should use table alias when provided', () => {
        const clause = buildJamaatClause({ jamat_id: 'nsw-marsden-park' }, 'm');
        expect(clause).toBe("m.jamaat IN ('Marsden Park', 'NSW: Marsden Park', 'Sydney')");
    });
});

describe('injectJamaatFilter', () => {
    it('should return the original query when filter is null', () => {
        const query = 'SELECT * FROM members';
        expect(injectJamaatFilter(query, null)).toBe(query);
    });

    it('should add WHERE clause when query has no WHERE', () => {
        fc.assert(
            fc.property(
                fc.stringMatching(/^[a-zA-Z_]+$/),
                fc.string({ minLength: 1 }),
                (table, jamatId) => {
                    const query = `SELECT * FROM ${table}`;
                    const result = injectJamaatFilter(query, { jamat_id: jamatId });
                    const escapedId = jamatId.replace(/'/g, "''");
                    return result.includes(`WHERE jamaat = '${escapedId}'`) || result.includes(`jamaat IN (`);
                },
            ),
        );
    });

    it('should inject before existing WHERE clause', () => {
        fc.assert(
            fc.property(
                fc.stringMatching(/^[a-zA-Z_]+$/),
                fc.string({ minLength: 1 }),
                (condition, jamatId) => {
                    const query = `SELECT * FROM t WHERE ${condition} = 1`;
                    const result = injectJamaatFilter(query, { jamat_id: jamatId });
                    return result.includes(`AND`) && result.includes(`${condition} = 1`);
                },
            ),
        );
    });

    it('should inject before GROUP BY when no WHERE exists', () => {
        const query = 'SELECT gender, COUNT(*) FROM members GROUP BY gender';
        const result = injectJamaatFilter(query, { jamat_id: 'nsw-marsden-park' });
        expect(result).toBe("SELECT gender, COUNT(*) FROM members WHERE jamaat IN ('Marsden Park', 'NSW: Marsden Park', 'Sydney') GROUP BY gender");
    });

    it('should inject before ORDER BY when no WHERE or GROUP BY exists', () => {
        const query = 'SELECT * FROM members ORDER BY name';
        const result = injectJamaatFilter(query, { jamat_id: 'nsw-marsden-park' });
        expect(result).toBe("SELECT * FROM members WHERE jamaat IN ('Marsden Park', 'NSW: Marsden Park', 'Sydney') ORDER BY name");
    });
});
