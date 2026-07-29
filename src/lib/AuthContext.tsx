import { createContext, useContext, useEffect, useState, type FC, type ReactNode } from 'react';
import { getUserFromCookie, hasPermission, getJamaatFilter, signOut as authSignOut, type WnUserContext, type JamaatFilter } from './auth';

export interface AuthState {
    user: WnUserContext | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    hasPermission: (action: string) => boolean;
    getJamaatFilter: () => JamaatFilter | null;
    signOut: () => void;
}

const AuthContext = createContext<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    hasPermission: () => false,
    getJamaatFilter: () => null,
    signOut: () => {},
});

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<WnUserContext | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const u = getUserFromCookie();
        setUser(u);
        setIsLoading(false);
    }, []);

    const value: AuthState = {
        user,
        isAuthenticated: user !== null,
        isLoading,
        hasPermission: (action: string) => hasPermission(user, action),
        getJamaatFilter: () => getJamaatFilter(user),
        signOut: authSignOut,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthState => useContext(AuthContext);
