'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export const Navbar = () => {
    const { user, logout } = useAuth();

    return (
        <nav className="bg-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <Link href="/dashboard" className="text-2xl font-bold text-indigo-600">
                        TaskApp
                    </Link>
                    <div className="flex items-center space-x-4">
                        {user && (
                            <span className="text-gray-700">Hello, {user.name} ({user.role})</span>
                        )}
                        <button
                            onClick={logout}
                            className="px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};