'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Task, TaskStatus } from '@/lib/types';
import toast from 'react-hot-toast';
import { useTaskList } from '@/context/TaskListContext'; // New Import
import Link from 'next/link';

export const TaskList = () => {
    const { shouldRefresh } = useTaskList(); // Use context state
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const res = await api.get('/tasks');
            setTasks(res.data);
        } catch (error) {
            toast.error('Failed to fetch tasks.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, [shouldRefresh]); // Re-fetch whenever shouldRefresh state changes

    if (loading) {
        return <div className="p-4 bg-white rounded-lg shadow">Loading tasks...</div>;
    }

    const getStatusColor = (status: TaskStatus) => {
        switch (status) {
            case TaskStatus.COMPLETED: return 'bg-green-100 text-green-800';
            case TaskStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-800';
            default: return 'bg-yellow-100 text-yellow-800';
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-2">My Tasks ({tasks.length})</h2>

            {tasks.length === 0 ? (
                <p className="text-gray-500">You currently have no assigned or created tasks.</p>
            ) : (
                <ul className="space-y-4">
                    {tasks.map((task) => (
                        <li key={task.id} className="p-4 border border-gray-200 rounded-md hover:bg-gray-50 transition duration-150">
                            <Link href={`/dashboard/task/${task.id}`}>
                                <div className="flex justify-between items-start">
                                    <h3 className="text-lg font-bold text-indigo-600 hover:underline">{task.title}</h3>
                                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                                        {task.status.replace('_', ' ')}
                                    </span>
                                </div>
                            </Link>
                            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                            <div className="mt-2 text-xs text-gray-500">
                                Created by: **{task.creator.name}**
                                <span className="ml-4">Assigned to: {task.assignedUsers.map(u => u.name).join(', ')}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};