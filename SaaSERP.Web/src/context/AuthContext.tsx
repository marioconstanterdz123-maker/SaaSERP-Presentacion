import React, { createContext, useContext, useState, useEffect } from 'react';

// Decodificar JWT sin librerías externas (el payload es Base64)
const parseJwt = (token: string): any => {
    try {
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(base64));
    } catch {
        return null;
    }
};

interface AuthUser {
    id: string;
    email: string;
    rol: string;
    negocioId: number | null;
    nombre: string;
}

interface AuthContextType {
    user: AuthUser | null;
    token: string | null;
    login: (token: string) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'saas_token';

const decodeToken = (token: string): AuthUser | null => {
    try {
        const decoded: any = parseJwt(token);
        if (!decoded) return null;
        return {
            id: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || decoded.sub || '',
            email: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || decoded.email || '',
            rol: decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded.role || 'Operativo',
            negocioId: decoded.NegocioId ? parseInt(decoded.NegocioId) : null,
            nombre: decoded.name || decoded.email || '',
        };
    } catch {
        return null;
    }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        if (storedToken) {
            const decoded = decodeToken(storedToken);
            if (decoded) {
                setToken(storedToken);
                setUser(decoded);
            } else {
                localStorage.removeItem(TOKEN_KEY);
            }
        }
        setIsLoading(false);
    }, []);

    const login = (newToken: string) => {
        const decoded = decodeToken(newToken);
        if (decoded) {
            localStorage.setItem(TOKEN_KEY, newToken);
            setToken(newToken);
            setUser(decoded);
        }
    };

    const logout = () => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
};

export default AuthContext;
