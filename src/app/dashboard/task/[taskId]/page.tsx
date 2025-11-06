'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { api } from '@/lib/api';
import { Task, TaskStatus, SubTask, InvitationStatus, AssignedUser, Role } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useRouter, useParams } from 'next/navigation';

export default function TaskDetailPage() {
    const params = useParams();
    const taskId = params.taskId as string;

    const { user, isAdmin } = useAuth();
    const router = useRouter();
    const [task, setTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(true);
    const [isCreator, setIsCreator] = useState(false);
    const [isAssigned, setIsAssigned] = useState(false);
    const [subTaskTitle, setSubTaskTitle] = useState('');
    const [subTaskAssignedUserId, setSubTaskAssignedUserId] = useState('');

    const fetchTask = useCallback(async () => {
        if (!taskId) return;
        try {
            const res = await api.get(`/tasks/${taskId}`);
            const fetchedTask: Task = res.data;
            setTask(fetchedTask);

            const creatorId = fetchedTask.creatorId;
            const assignedIds = fetchedTask.assignedUsers.map(u => u.id);

            setIsCreator(user?.id === creatorId);
            setIsAssigned(assignedIds.includes(user?.id!));
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to fetch task.');
            router.push('/dashboard');
        } finally {
            setLoading(false);
        }
    }, [taskId, router, user?.id]);

    useEffect(() => {
        if (taskId) {
            fetchTask();
        }
    }, [taskId, fetchTask]);

    const handleDeleteTask = async () => {
        if (!window.confirm('Are you sure you want to delete this task and all related sub-tasks?')) return;
        try {
            await api.delete(`/tasks/${taskId}`);
            toast.success('Task deleted successfully.');
            router.push('/dashboard');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete task.');
        }
    };

    const handleInviteUser = async (email: string) => {
        if (!isCreator && !isAdmin) return toast.error('Only the creator or admin can invite users.');
        try {
            await api.post(`/tasks/${taskId}/invite`, { email });
            toast.success(`Invitation sent to ${email}.`);
            fetchTask();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to send invitation.');
        }
    };

    const handleRespondToInvitation = async (invitationId: string, action: 'accept' | 'reject') => {
        try {
            await api.patch(`/tasks/invitations/${invitationId}`, { action });
            toast.success(action === 'accept' ? 'Invitation accepted! Welcome to the task.' : 'Invitation rejected.');
            fetchTask();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update invitation status.');
        }
    };

    const handleCreateSubTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subTaskTitle || !subTaskAssignedUserId) {
            return toast.error('Title and assigned user are required.');
        }
        try {
            await api.post(`/tasks/${taskId}/subtasks`, {
                title: subTaskTitle,
                assignedUserId: subTaskAssignedUserId,
            });
            setSubTaskTitle('');
            setSubTaskAssignedUserId('');
            toast.success('Sub-task created and user notified!');
            fetchTask();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create sub-task.');
        }
    };

    const handleUpdateSubTaskStatus = async (subTaskId: string, status: TaskStatus) => {
        try {
            await api.patch(`/subtasks/${subTaskId}`, { status });
            toast.success('Sub-task status updated.');
            fetchTask();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update sub-task status.');
        }
    };

    if (loading || !task) {
        return (
            <ProtectedRoute>
                <Navbar />
                <div className="text-center mt-20 text-xl">Loading Task Details...</div>
            </ProtectedRoute>
        );
    }

    const taskMembers = task.assignedUsers;
    const pendingInvitation = task.invitations.find(inv => inv.invitedUserId === user?.id && inv.status === InvitationStatus.PENDING);

    return (
        <ProtectedRoute>
            <Navbar />
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-2">{task.title}</h1>
                <p className="text-lg text-gray-600 mb-6">{task.description}</p>

                {pendingInvitation && (
                    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 flex justify-between items-center" role="alert">
                        <p className="font-bold">Task Invitation Pending</p>
                        <p className="text-sm">
                            You were invited by {pendingInvitation.invitedByUser.name}. Do you accept?
                        </p>
                        <div className='space-x-2'>
                            <button
                                onClick={() => handleRespondToInvitation(pendingInvitation.id, 'accept')}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-sm"
                            >
                                Accept
                            </button>
                            <button
                                onClick={() => handleRespondToInvitation(pendingInvitation.id, 'reject')}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-3 gap-6 bg-white p-6 rounded-lg shadow mb-8">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Status</p>
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${task.status === TaskStatus.COMPLETED ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {task.status.replace('_', ' ')}
                        </span>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Creator</p>
                        <p className="text-base text-gray-900">{task.creator.name}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Assigned Members</p>
                        <p className="text-base text-gray-900">{task.assignedUsers.map(u => u.name).join(', ')}</p>
                    </div>

                    {(isCreator || isAdmin) && (
                        <div className="col-span-3 border-t pt-4 flex justify-between">
                            <button
                                onClick={() => handleInviteUser(prompt('Enter email to invite:') || '')}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                            >
                                Invite New User
                            </button>
                            <button
                                onClick={handleDeleteTask}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                            >
                                Delete Task
                            </button>
                        </div>
                    )}
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-2">Sub-Tasks ({task.subTasks.length})</h2>

                    {(isCreator || isAssigned) && (
                        <form onSubmit={handleCreateSubTask} className="flex gap-4 mb-6 p-4 border rounded-md bg-gray-50">
                            <input
                                type="text"
                                placeholder="New Sub-task Title"
                                value={subTaskTitle}
                                onChange={(e) => setSubTaskTitle(e.target.value)}
                                className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
                            />
                            <select
                                value={subTaskAssignedUserId}
                                onChange={(e) => setSubTaskAssignedUserId(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
                            >
                                <option value="">Assign To...</option>
                                {taskMembers.map(member => (
                                    <option key={member.id} value={member.id}>{member.name}</option>
                                ))}
                            </select>
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                            >
                                Add Sub-task
                            </button>
                        </form>
                    )}

                    <ul className="space-y-3">
                        {task.subTasks.length === 0 ? (
                            <p className='text-gray-500'>No sub-tasks yet.</p>
                        ) : (
                            task.subTasks.map((subtask) => (
                                <li key={subtask.id} className="p-3 border rounded-md flex justify-between items-center hover:bg-gray-50">
                                    <div>
                                        <p className="font-medium">{subtask.title}</p>
                                        <p className="text-xs text-gray-500">Assigned to: {subtask.assignedUser.name}</p>
                                    </div>
                                    <div className='flex items-center gap-3'>
                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${subtask.status === TaskStatus.COMPLETED ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {subtask.status.replace('_', ' ')}
                                        </span>
                                        {(subtask.assignedUserId === user?.id || isCreator || isAdmin) && (
                                            <select
                                                value={subtask.status}
                                                onChange={(e) => handleUpdateSubTaskStatus(subtask.id, e.target.value as TaskStatus)}
                                                className="px-2 py-1 text-xs border rounded-md cursor-pointer"
                                            >
                                                {Object.values(TaskStatus).map(status => (
                                                    <option key={status} value={status}>{status.replace('_', ' ')}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </div>
        </ProtectedRoute>
    );
}