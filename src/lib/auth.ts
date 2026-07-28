export interface WnUserContext {
    userId: string;
    email: string;
    groups: string[];
    primaryRole: string | null;
    jamatId: string | null;
    functionalRoles: string[];
    fullNameEn?: string;
    fullNameUr?: string;
}

function getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*=\\s*([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payload = parts[1];
        const padded = payload.length % 4 === 3 ? payload + '=' : payload.length % 4 === 2 ? payload + '==' : payload;
        const decoded = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(decoded);
    } catch {
        return null;
    }
}

export function getUserFromCookie(): WnUserContext | null {
    const token = getCookie('__wn_idtoken');
    if (!token) return null;
    const payload = decodeJwtPayload(token);
    if (!payload) return null;

    const claims = payload as Record<string, unknown>;

    return {
        userId: (claims.sub as string) ?? '',
        email: (claims.email as string) ?? '',
        groups: (claims['cognito:groups'] as string[]) ?? [],
        primaryRole: (claims['custom:primary_role'] as string) ?? null,
        jamatId: (claims['custom:jamaat_id'] as string) ?? null,
        functionalRoles: (claims['custom:functional_roles'] as string)
            ? (claims['custom:functional_roles'] as string).split(',').filter(Boolean)
            : [],
        fullNameEn: claims['custom:full_name_en'] as string | undefined,
        fullNameUr: claims['custom:full_name_ur'] as string | undefined,
    };
}

export function hasPermission(user: WnUserContext | null, action: string): boolean {
    if (!user) return false;

    if (user.groups.includes('wn-national-secretary')) return true;

    if (user.groups.includes('wn-naib-secretary-national')) {
        if (action === 'wn:system:configure') return false;
        return true;
    }

    if (user.groups.includes('wn-jamat-secretary')) {
        if (!user.jamatId) return false;
        if (action === 'wn:reports:view') return true;
        if (action === 'wn:reports:export') return true;
        if (action === 'wn:members:read') return true;
        return false;
    }

    if (user.groups.includes('wn-jamat-naib')) {
        if (!user.jamatId) return false;
        if (action === 'wn:reports:view') return true;
        if (action === 'wn:members:read') return true;
        if (action === 'wn:reports:export') return false;
        return false;
    }

    return false;
}

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
