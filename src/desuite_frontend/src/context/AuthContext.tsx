import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { desuite_backend } from '../../../declarations/desuite_backend';
import { Principal } from '@dfinity/principal';

// Backend types
type UserRole = {
    'superAdmin': null;
} | {
    'spaceAdmin': null;
} | {
    'member': null;
};

interface BackendUser {
    id: Principal;
    username: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    createdAt: bigint;
    bio: [] | [string];
    avatar: [] | [string];
    points: bigint;
    spaces: string[];
}

// Frontend types
interface AuthUser {
    id: string;
    username: string;
    email: string;
    role: string;
    points: number;
    spaces: string[];
}

interface AuthContextType {
    user: AuthUser | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
        }
    }, []);

    const transformUser = (backendUser: any): AuthUser => ({
        id: backendUser.id.toText(),
        username: backendUser.username,
        email: backendUser.email,
        role: Object.keys(backendUser.role)[0],
        points: Number(backendUser.points),
        spaces: backendUser.spaces,
    });

    const login = async (email: string, password: string) => {
        try {
            const result = await desuite_backend.login(email, password);
            if ('ok' in result) {
                const userData = transformUser(result.ok);
                setUser(userData);
                setIsAuthenticated(true);
                localStorage.setItem('user', JSON.stringify(userData));
            } else {
                throw new Error(result.err);
            }
        } catch (error) {
            console.error('Login error:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Login failed');
        }
    };

    const register = async (username: string, email: string, password: string) => {
        try {
            console.log('Register attempt:', { username, email }); // Debug log
            const result = await desuite_backend.register(username, email, password);
            console.log('Register result:', result); // Debug log

            if ('ok' in result) {
                const userData = transformUser(result.ok);
                setUser(userData);
                setIsAuthenticated(true);
                localStorage.setItem('user', JSON.stringify(userData));
            } else {
                throw new Error(result.err);
            }
        } catch (error) {
            console.error('Registration error:', error); // Debug log
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Registration failed');
        }
    };

    const logout = () => {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};