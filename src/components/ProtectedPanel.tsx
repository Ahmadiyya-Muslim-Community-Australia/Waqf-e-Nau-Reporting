/**
 * ProtectedPanel.tsx — Future RBAC wrapper for restricted content.
 *
 * Wraps panels/pages that should only be accessible to authenticated users
 * with specific roles/permissions. Currently acts as a pass-through until
 * Cognito authentication is wired up — ready to receive a permission check
 * from WnAuthorizationService when that lands.
 *
 * Integration planned:
 *   - Read JWT from localStorage / cookies (Cognito tokens)
 *   - Decode & verify via WnAuthorizationService.parseUserContext()
 *   - Evaluate access with WnAuthorizationService.checkAccess()
 *   - Fallback: show a "restricted access" message
 *
 * @example
 *   <ProtectedPanel requiredPermission="wn:members:view">
 *     <TajneedPage />
 *   </ProtectedPanel>
 */

import { AlertTriangle, Lock } from 'lucide-react';
import type { FC, ReactNode } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Card, CardContent } from '@sqlrooms/ui';

// ── Types ────────────────────────────────────────────────────────────

/**
 * Describes the authenticated user context.
 * Currently a placeholder — will be populated from Cognito JWT.
 */
export interface UserContext {
    /** Primary role identifier (e.g. 'wn-jamat-secretary') */
    primaryRole: string;
    /** Scoping jama'at ID (null for national-level roles) */
    jamaatId: string | null;
    /** Comma-separated functional role codes */
    functionalRoles: string;
    /** Display name (English) */
    displayNameEn: string;
    /** Display name (Urdu) */
    displayNameUr: string;
}

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Stub: evaluate whether the current user context satisfies a permission.
 *
 * TODO: Replace with real call to WnAuthorizationService.checkAccess()
 *       once Cognito token handling is wired up.
 *
 * For the stub phase, returns true — all content is accessible.
 * Once RBAC is active, this will:
 *   1. Check explicit DENY policies (always win)
 *   2. Check for national-secretary role → implicit ALLOW
 *   3. Evaluate resource scope vs user's jamaat_id
 *   4. Fall through to functional role checks
 */
function canAccess(
    _user: UserContext | null,
    _permission: string,
): boolean {
    // Stub: pass-through until Cognito integration
    return true;
}

/**
 * Read the current user context from wherever it's stored.
 *
 * TODO: Parse from Cognito ID token stored in memory/session.
 *       The token is injected by the CloudFront auth Lambda
 *       (cloudfront-auth-gate.js) as a cookie or header.
 */
function getCurrentUser(): UserContext | null {
    // Stub: no user until Cognito is wired up
    return null;
}

// ── Props ────────────────────────────────────────────────────────────

export interface ProtectedPanelProps {
    /** The permission string to check (e.g. 'wn:members:view') */
    requiredPermission: string;
    /** Content to render when authorized */
    children: ReactNode;
    /** Optional fallback shown when unauthorized (defaults to locked card) */
    fallback?: ReactNode;
    /** Optional user context override (for testing/auth simulation) */
    userOverride?: UserContext | null;
}

// ── Component ────────────────────────────────────────────────────────

export const ProtectedPanel: FC<ProtectedPanelProps> = ({
    requiredPermission,
    children,
    fallback,
    userOverride,
}) => {
    const { t } = useLanguage();
    const user = userOverride !== undefined ? userOverride : getCurrentUser();

    if (canAccess(user, requiredPermission)) {
        return <>{children}</>;
    }

    // Unauthorized fallback
    if (fallback) {
        return <>{fallback}</>;
    }

    return (
        <Card className="mx-auto mt-12 max-w-md">
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                    <Lock className="h-6 w-6" />
                </div>
                <div>
                    <h3 className="mb-1 text-lg font-semibold text-slate-900 dark:text-white">
                        {t('restrictedAccess')}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {t('restrictedAccessDesc')}
                    </p>
                </div>
                <div className="flex items-center gap-1.5 rounded-md bg-amber-50 px-3 py-1.5 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>
                        {t('requiredPermission')}: <code className="font-mono font-semibold">{requiredPermission}</code>
                    </span>
                </div>
            </CardContent>
        </Card>
    );
};
