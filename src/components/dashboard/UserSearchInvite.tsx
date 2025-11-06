'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { User, Role } from '@/lib/types'; // <-- ADD Role here
import toast from 'react-hot-toast';

export const UserSearchInvite = () => {
    const [searchEmail, setSearchEmail] = useState('');
    const [foundUser, setFoundUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setFoundUser(null);
        if (!searchEmail) {
            toast.error('Please enter an email address.');
            setLoading(false);
            return;
        }

        try {
            // Note: This assumes /users endpoint is accessible to ADMIN and allows search by email
            // Since your backend only allows ADMIN to see ALL, we'll implement a dedicated search endpoint later if needed.
            // For now, this is a placeholder UI for where you might invite or manage users.

            // Simulating a successful search for demonstration
            toast('User search feature is complex! Showing example UI.', { icon: '🔍' });
            setFoundUser({ id: 'dummy-id', email: searchEmail, name: 'Sample User', role: Role.USER });
        } catch (error: any) {
            toast.error('User not found or you lack permission.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">User Search & Invitation</h3>
            <form onSubmit={handleSearch} className="flex gap-2">
                <input
                    type="email"
                    placeholder="Search user by email"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
                    disabled={loading}
                />
                <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-green-400"
                    disabled={loading}
                >
                    {loading ? 'Searching...' : 'Search'}
                </button>
            </form>

            {foundUser && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md text-sm">
                    <p className="font-medium text-green-800">User Found: {foundUser.name}</p>
                    <p className="text-gray-700">{foundUser.email}</p>
                    <p className="mt-2 text-xs text-gray-500">
                        This user can now be invited to a task on the **Task Detail Page** (next step).
                    </p>
                </div>
            )}
        </div>
    );
};