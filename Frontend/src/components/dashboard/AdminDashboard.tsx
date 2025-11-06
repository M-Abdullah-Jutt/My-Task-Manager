'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

type Role = 'ADMIN' | 'USER';
type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
type SubTaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

interface BaseTask {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
}

interface UserInList {
    id: string;
    name: string;
    email: string;
    role: Role;
    createdAt: Date;
}

interface TaskWithDetails extends BaseTask {
    assignedUsers: { id: string; name: string }[];
    subTasks: { id: string; title: string; status: SubTaskStatus }[];
}

const AdminDashboard: React.FC = () => {
    const { user: admin } = useAuth();
    const [view, setView] = useState<'users' | 'tasks'>('users');
    const [users, setUsers] = useState<UserInList[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserInList | null>(null);
    const [userTasks, setUserTasks] = useState<TaskWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (view === 'users') {
            fetchUsers();
        }
    }, [view]);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/admin/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUserSelect = async (user: UserInList) => {
        setSelectedUser(user);
        setIsLoading(true);
        try {
            const response = await api.get(`/admin/users/${user.id}/tasks`);
            setUserTasks(response.data);
            setView('tasks');
        } catch (error) {
            console.error(`Failed to fetch tasks for user ${user.name}:`, error);
        } finally {
            setIsLoading(false);
        }
    };

    const renderUserList = () => (
        <div className="space-y-3">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">All Registered Users ({users.length})</h2>
            {users.map((user) => (
                <div
                    key={user.id}
                    className="p-4 bg-white border rounded-lg shadow-sm cursor-pointer hover:bg-blue-50 transition duration-150 flex justify-between items-center"
                    onClick={() => handleUserSelect(user)}
                >
                    <div>
                        <p className="font-semibold text-gray-900">{user.name}
                            <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${user.role === 'ADMIN' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                {user.role}
                            </span>
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">View Tasks &rarr;</button>
                </div>
            ))}
        </div>
    );

    const renderUserTasks = () => (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800">Tasks for: {selectedUser?.name}</h2>
            {userTasks.length === 0 ? (
                <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800">{selectedUser?.name} currently has no assigned or created tasks.</p>
                </div>
            ) : (
                userTasks.map((task) => (
                    <div key={task.id} className="p-6 bg-white border border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition duration-300">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{task.title}</h3>
                        <p className={`text-sm font-medium ${task.status === 'COMPLETED' ? 'text-green-600' : 'text-orange-600'}`}>
                            Status: {task.status.replace('_', ' ')}
                        </p>
                        <p className="text-sm text-gray-700 mt-2">{task.description}</p>

                        <div className="mt-4 pt-3 border-t border-gray-100">
                            <p className="text-xs font-semibold text-gray-500">Assigned Users:</p>
                            <p className="text-sm text-gray-600">{task.assignedUsers.map(u => u.name).join(', ')}</p>

                            {task.subTasks.length > 0 && (
                                <div className="mt-3">
                                    <p className="text-xs font-semibold text-gray-500">Subtasks ({task.subTasks.length}):</p>
                                    <ul className="list-disc list-inside text-sm text-gray-600 ml-2">
                                        {task.subTasks.map(subTask => (
                                            <li key={subTask.id} className={subTask.status === 'COMPLETED' ? 'line-through text-green-700' : 'text-gray-700'}>
                                                {subTask.title}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    );

    return (
        <div className="p-4 bg-gray-100 min-h-[calc(100vh-64px)]">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-6 border-b pb-3">Admin Panel</h1>
            <p className="text-lg text-gray-600 mb-6">Welcome, {admin?.name}. Manage all users and tasks here.</p>

            {view === 'tasks' && (
                <div className="mb-6">
                    <button
                        onClick={() => { setView('users'); setSelectedUser(null); setUserTasks([]); }}
                        className="flex items-center text-blue-600 hover:text-blue-800 font-semibold transition duration-150"
                    >
                        <span className="text-lg mr-2">&larr;</span> Back to User List
                    </button>
                </div>
            )}

            {isLoading && <p className="text-lg text-blue-600">Loading data...</p>}

            {!isLoading && view === 'users' && renderUserList()}
            {!isLoading && view === 'tasks' && renderUserTasks()}
        </div>
    );
};

export default AdminDashboard;