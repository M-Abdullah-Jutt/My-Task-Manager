// src/components/dashboard/DashboardContent.tsx

"use client"; // 🚀 CRITICAL FIX: This makes it a Client Component

import { TaskList } from '@/components/dashboard/TaskList';
import { NotificationsPanel } from '@/components/dashboard/NotificationsPanel';
import { CreateTaskButton } from '../../components/dashboard/CreateTaskButton';
import { UserSearchInvite } from '@/components/dashboard/UserSearchInvite';
import { TaskListProvider } from '@/context/TaskListContext';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import { useAuth } from '@/context/AuthContext';


export const DashboardContent = () => {
    // 💡 Fetch user data (including role) from your authentication context/store
    const { user } = useAuth();

    // Safety check during initial data fetch
    if (!user) {
        return <main className="max-w-7xl mx-auto py-8 px-4">Loading...</main>;
    }

    // 🚀 ADMIN DASHBOARD VIEW
    if (user.role === 'ADMIN') {
        return (
            <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <AdminDashboard />
            </main>
        );
    }

    // 🚀 STANDARD USER DASHBOARD VIEW 
    return (
        <TaskListProvider>
            <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-6">Your Dashboard</h1>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <CreateTaskButton />
                    <div className="w-full sm:w-1/2">
                        <UserSearchInvite />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <TaskList />
                    </div>
                    <div className="lg:col-span-1">
                        <NotificationsPanel />
                    </div>
                </div>
            </main>
        </TaskListProvider>
    );
};