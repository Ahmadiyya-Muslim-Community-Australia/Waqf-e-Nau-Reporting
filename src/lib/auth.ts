import { hasPermission as hasSharedPermission, ROLE_DEFAULTS, type Permission } from '@waqfenau/permissions';

export interface WnUserContext {
    userId: string;
    email: string;
    groups: string[];
    primaryRole: string | null;
    jamatId: string | null;
    functionalRoles: string[];
    fullNameEn?: string;
    fullNameUr?: string;
    permissions?: string[];
}

function getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*=\\s*([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
}

let _signingOut = false;

export function setSigningOut(v: boolean): void {
    _signingOut = v;
}

export function getUserFromCookie(): WnUserContext | null {
    if (_signingOut) return null;

    const userCookie = getCookie('_wn_user');
    if (userCookie) {
        const raw = decodeURIComponent(userCookie);
        if (raw.length < 2 || (raw[0] !== '{' && raw[0] !== '[')) return null;
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        if (typeof parsed !== 'object' || parsed === null) return null;
        return {
            userId: (parsed.userId as string) ?? '',
            email: (parsed.email as string) ?? '',
            groups: (parsed.groups as string[]) ?? [],
            primaryRole: (parsed.primaryRole as string) ?? null,
            jamatId: (parsed.jamatId as string) ?? null,
            functionalRoles: [],
            fullNameEn: parsed.fullNameEn as string | undefined,
            fullNameUr: parsed.fullNameUr as string | undefined,
            permissions: (parsed.permissions as string[]) ?? [],
        };
    }

    return null;
}

const OLD_TO_NEW: Record<string, Permission> = {
    'wn:reports:view': 'reports:view',
    'wn:reports:export': 'reports:export',
    'wn:members:read': 'members:read',
    'wn:members:write': 'members:read',
    'wn:system:configure': 'config:write',
};

function resolvePermissions(user: WnUserContext | null): readonly Permission[] {
    if (!user) return [];

    if (user.groups.includes('wn-national-secretary')) {
        return ROLE_DEFAULTS['wn-national-secretary'];
    }

    if (user.permissions && user.permissions.length > 0) {
        return user.permissions as Permission[];
    }

    if (user.primaryRole && ROLE_DEFAULTS[user.primaryRole]) {
        return ROLE_DEFAULTS[user.primaryRole];
    }

    const matchedGroup = user.groups.find((g) => ROLE_DEFAULTS[g]);
    if (matchedGroup) {
        return ROLE_DEFAULTS[matchedGroup];
    }

    return [];
}

export function hasPermission(user: WnUserContext | null, action: string): boolean {
    const permissions = resolvePermissions(user);
    const mapped = OLD_TO_NEW[action] ?? action;
    return hasSharedPermission(permissions, mapped as Permission);
}

export { OLD_TO_NEW };

export interface JamaatFilter {
    jamat_id: string;
}

export function getJamaatFilter(user: WnUserContext | null): JamaatFilter | null {
    if (!user) return null;

    if (user.groups.includes('wn-national-secretary')) return null;
    if (user.groups.includes('wn-naib-secretary-national')) return null;

    if (user.groups.includes('wn-jamat-secretary') || user.groups.includes('wn-jamat-naib')) {
        if (!user.jamatId) return { jamat_id: '' };
        return { jamat_id: user.jamatId };
    }

    return { jamat_id: '' };
}

export function signOut(): void {
    setSigningOut(true);
    window.location.href = '/_auth/logout';
}
