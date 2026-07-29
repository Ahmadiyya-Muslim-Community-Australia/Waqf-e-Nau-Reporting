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

    it('should produce a valid subquery clause with escaped quotes', () => {
        fc.assert(
            fc.property(fc.string({ minLength: 1, maxLength: 50 }), (jamatId) => {
                const clause = buildJamaatClause({ jamat_id: jamatId });
                const escapedId = jamatId.replace(/'/g, "''");
                return clause === `jamaat IN (SELECT label FROM jamaats WHERE jamaatId = '${escapedId}')`;
            }),
        );
    });

    it('should use table alias when provided', () => {
        fc.assert(
            fc.property(fc.string({ minLength: 1 }), (jamatId) => {
                const clause = buildJamaatClause({ jamat_id: jamatId }, 'm');
                return clause.startsWith('m.jamaat') && clause.includes('SELECT label FROM jamaats');
            }),
        );
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
                    return result.includes(`WHERE jamaat IN (SELECT label FROM jamaats WHERE jamaatId = '${escapedId}')`);
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
                    const escapedId = jamatId.replace(/'/g, "''");
                    return result.includes(`WHERE jamaat IN (SELECT label FROM jamaats WHERE jamaatId = '${escapedId}') AND`) && result.includes(`${condition} = 1`);
                },
            ),
        );
    });

    it('should inject before GROUP BY when no WHERE exists', () => {
        const query = 'SELECT gender, COUNT(*) FROM members GROUP BY gender';
        const result = injectJamaatFilter(query, { jamat_id: 'test-id' });
        expect(result).toBe("SELECT gender, COUNT(*) FROM members WHERE jamaat IN (SELECT label FROM jamaats WHERE jamaatId = 'test-id') GROUP BY gender");
    });

    it('should inject before ORDER BY when no WHERE or GROUP BY exists', () => {
        const query = 'SELECT * FROM members ORDER BY name';
        const result = injectJamaatFilter(query, { jamat_id: 'test-id' });
        expect(result).toBe("SELECT * FROM members WHERE jamaat IN (SELECT label FROM jamaats WHERE jamaatId = 'test-id') ORDER BY name");
    });
});
