'use client';

import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { User, Role } from '@/lib/types'; // We'll create this types file next

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    login: (accessToken: string, refreshToken: string, userData: User) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const loadUserFromCookies = async () => {
            const accessToken = Cookies.get('accessToken');
            if (accessToken) {
                try {
                    // Verify token validity by fetching profile
                    const res = await api.get('/users/profile');
                    setUser(res.data);
                } catch (error) {
                    // Token invalid or expired, clear and force login
                    logout();
                }
            }
            setIsLoading(false);
        };
        loadUserFromCookies();
    }, []);

    const login = (accessToken: string, refreshToken: string, userData: User) => {
        Cookies.set('accessToken', accessToken, { expires: 1 / 24, secure: process.env.NODE_ENV === 'production' }); // 1 hour expiration
        Cookies.set('refreshToken', refreshToken, { expires: 7, secure: process.env.NODE_ENV === 'production' }); // 7 day expiration
        setUser(userData);
        router.push('/dashboard');
    };

    const logout = () => {
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        setUser(null);
        router.push('/login');
    };

    const isAuthenticated = !!user;
    const isAdmin = user?.role === Role.ADMIN;

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, isAdmin, login, logout, isLoading }}>
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