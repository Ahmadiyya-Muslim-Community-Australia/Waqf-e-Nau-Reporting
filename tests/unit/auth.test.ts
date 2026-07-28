import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { hasPermission, getJamaatFilter } from '../../src/lib/auth';
import type { WnUserContext } from '../../src/lib/auth';

const mockUser = (overrides?: Partial<WnUserContext>): WnUserContext => ({
    userId: 'test-user',
    email: 'test@example.com',
    groups: [],
    primaryRole: null,
    jamatId: null,
    functionalRoles: [],
    ...overrides,
});

describe('hasPermission', () => {
    it('should deny all actions for null user', () => {
        fc.assert(
            fc.property(fc.string(), (action) => {
                return hasPermission(null, action) === false;
            }),
        );
    });

    it('should deny all actions for user with no groups and no role', () => {
        fc.assert(
            fc.property(fc.string(), (action) => {
                const user = mockUser();
                return hasPermission(user, action) === false;
            }),
        );
    });

    it('should grant all actions to national secretary', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('wn:reports:view', 'wn:reports:export', 'wn:members:read', 'wn:members:write', 'wn:system:configure'),
                (action) => {
                    const user = mockUser({ groups: ['wn-national-secretary'] });
                    return hasPermission(user, action) === true;
                },
            ),
        );
    });

    it('should grant most actions to naib secretary but deny system configure', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('wn:reports:view', 'wn:reports:export', 'wn:members:read', 'wn:members:write'),
                (action) => {
                    const user = mockUser({ groups: ['wn-naib-secretary-national'] });
                    return hasPermission(user, action) === true;
                },
            ),
        );
    });

    it('should deny system configure to naib secretary', () => {
        const user = mockUser({ groups: ['wn-naib-secretary-national'] });
        expect(hasPermission(user, 'wn:system:configure')).toBe(false);
    });

    it('should grant reports view to jamaat secretary with jamatId', () => {
        fc.assert(
            fc.property(fc.string({ minLength: 1 }), (jamatId) => {
                const user = mockUser({ groups: ['wn-jamat-secretary'], jamatId });
                return hasPermission(user, 'wn:reports:view') === true;
            }),
        );
    });

    it('should deny all actions to jamaat secretary without jamatId', () => {
        fc.assert(
            fc.property(fc.string(), (action) => {
                const user = mockUser({ groups: ['wn-jamat-secretary'], jamatId: null });
                return hasPermission(user, action) === false;
            }),
        );
    });

    it('should grant reports view and members read to jamaat secretary', () => {
        const user = mockUser({ groups: ['wn-jamat-secretary'], jamatId: 'j1' });
        expect(hasPermission(user, 'wn:reports:view')).toBe(true);
        expect(hasPermission(user, 'wn:reports:export')).toBe(true);
        expect(hasPermission(user, 'wn:members:read')).toBe(true);
    });

    it('should grant reports view and members read to jamaat naib', () => {
        const user = mockUser({ groups: ['wn-jamat-naib'], jamatId: 'j1' });
        expect(hasPermission(user, 'wn:reports:view')).toBe(true);
        expect(hasPermission(user, 'wn:members:read')).toBe(true);
    });

    it('should deny export to jamaat naib', () => {
        const user = mockUser({ groups: ['wn-jamat-naib'], jamatId: 'j1' });
        expect(hasPermission(user, 'wn:reports:export')).toBe(false);
    });

    it('should deny all actions to jamaat naib without jamatId', () => {
        fc.assert(
            fc.property(fc.string(), (action) => {
                const user = mockUser({ groups: ['wn-jamat-naib'], jamatId: null });
                return hasPermission(user, action) === false;
            }),
        );
    });

    it('should deny all actions to user in reports-viewers group without wn-* role', () => {
        fc.assert(
            fc.property(fc.string(), (action) => {
                const user = mockUser({ groups: ['reports-viewers'] });
                return hasPermission(user, action) === false;
            }),
        );
    });
});

describe('getJamaatFilter', () => {
    it('should return null for null user', () => {
        expect(getJamaatFilter(null)).toBeNull();
    });

    it('should return null for national secretary', () => {
        const user = mockUser({ groups: ['wn-national-secretary'] });
        expect(getJamaatFilter(user)).toBeNull();
    });

    it('should return null for naib secretary', () => {
        const user = mockUser({ groups: ['wn-naib-secretary-national'] });
        expect(getJamaatFilter(user)).toBeNull();
    });

    it('should return jamat_id for jamaat secretary', () => {
        fc.assert(
            fc.property(fc.string({ minLength: 1 }), (jamatId) => {
                const user = mockUser({ groups: ['wn-jamat-secretary'], jamatId });
                const filter = getJamaatFilter(user);
                return filter?.jamat_id === jamatId;
            }),
        );
    });

    it('should return empty jamat_id for jamaat secretary without jamatId', () => {
        const user = mockUser({ groups: ['wn-jamat-secretary'], jamatId: null });
        expect(getJamaatFilter(user)).toEqual({ jamat_id: '' });
    });

    it('should return jamat_id for jamaat naib', () => {
        fc.assert(
            fc.property(fc.string({ minLength: 1 }), (jamatId) => {
                const user = mockUser({ groups: ['wn-jamat-naib'], jamatId });
                const filter = getJamaatFilter(user);
                return filter?.jamat_id === jamatId;
            }),
        );
    });

    it('should return empty jamat_id for user with no recognized role', () => {
        const user = mockUser({ groups: ['some-other-group'] });
        expect(getJamaatFilter(user)).toEqual({ jamat_id: '' });
    });
});
