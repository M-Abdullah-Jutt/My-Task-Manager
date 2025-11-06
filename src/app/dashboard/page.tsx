// src/app/dashboard/page.tsx (Updated)

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { DashboardContent } from '@/components/dashboard/DashboardContent';

// Remove unnecessary imports for components that are now inside DashboardContent.tsx
// Remove: TaskList, NotificationsPanel, CreateTaskButton, UserSearchInvite, TaskListProvider, AdminDashboard, useAuth

export default function DashboardPage() {
    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-100">
                <Navbar />
                {/* Renders the role-based content */}
                <DashboardContent />
            </div>
        </ProtectedRoute>
    );
}