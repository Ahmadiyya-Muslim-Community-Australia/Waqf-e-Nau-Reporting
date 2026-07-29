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

let _signingOut = false;

export function setSigningOut(v: boolean): void {
    _signingOut = v;
}

export function getUserFromCookie(): WnUserContext | null {
    if (_signingOut) return null;

    const userCookie = getCookie('_wn_user');
    if (userCookie) {
        try {
            const parsed = JSON.parse(decodeURIComponent(userCookie)) as Record<string, unknown>;
            return {
                userId: (parsed.userId as string) ?? '',
                email: (parsed.email as string) ?? '',
                groups: (parsed.groups as string[]) ?? [],
                primaryRole: (parsed.primaryRole as string) ?? null,
                jamatId: (parsed.jamatId as string) ?? null,
                functionalRoles: [],
                fullNameEn: parsed.fullNameEn as string | undefined,
                fullNameUr: parsed.fullNameUr as string | undefined,
            };
        } catch {
            return null;
        }
    }

    return null;
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

export function signOut(): void {
    setSigningOut(true);
    window.location.href = '/_auth/logout';
}
