import { AlertTriangle, Lock } from 'lucide-react';
import type { FC, ReactNode } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Card, CardContent } from '@sqlrooms/ui';
import { useAuth } from '../lib/AuthContext';

export interface ProtectedPanelProps {
    requiredPermission: string;
    children: ReactNode;
    fallback?: ReactNode;
}

export const ProtectedPanel: FC<ProtectedPanelProps> = ({
    requiredPermission,
    children,
    fallback,
}) => {
    const { t } = useLanguage();
    const { hasPermission, isLoading, user } = useAuth();
    const allowed = user ? hasPermission(requiredPermission) : false;

    if (isLoading) return null;

    if (allowed) {
        return <>{children}</>;
    }

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
