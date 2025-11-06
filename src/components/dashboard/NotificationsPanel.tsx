// src/components/dashboard/NotificationPanel.tsx
'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Notification } from '@/lib/types';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export const NotificationsPanel = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data);
        } catch (error) {
            toast.error('Failed to fetch notifications.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            toast.error('Failed to mark notification as read.');
        }
    };

    const handleInvitationAction = async (notificationId: string, invitationId: string, action: 'accept' | 'reject') => {
        try {
            await api.patch(`/tasks/invitations/${invitationId}`, { action });
            router.refresh();
            if (action === 'accept') {
                toast.success('Task accepted! It has been added to your task list.');
            } else {
                toast.success('Task invitation rejected. The inviter has been notified.');
            }
            await markAsRead(notificationId);
            await fetchNotifications();

        } catch (error: any) {
            const message = error.response?.data?.message || `Failed to ${action} the task invitation.`;
            toast.error(message);
            console.error(error);

            router.refresh();
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    if (loading) {
        return <div className="p-4 bg-white rounded-lg shadow">Loading notifications...</div>;
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow h-full">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-2">
                Notifications
                {unreadCount > 0 && <span className="ml-2 px-2 py-0.5 text-xs font-medium text-red-800 bg-red-100 rounded-full">{unreadCount} New</span>}
            </h2>

            {notifications.length === 0 ? (
                <p className="text-gray-500">No new notifications.</p>
            ) : (
                <ul className="space-y-3 max-h-96 overflow-y-auto">
                    {notifications.map((notif) => {
                        const isInvitation = notif.type === 'TASK_INVITATION' && !!notif.relatedInvitationId;

                        return (
                            <li
                                key={notif.id}
                                className={`p-3 rounded-md transition duration-150 ${notif.isRead ? 'bg-gray-50 text-gray-600' : 'bg-blue-50 text-gray-800 border-l-4 border-blue-500'}`}
                                onClick={() => !notif.isRead && !isInvitation && markAsRead(notif.id)}
                            >
                                <p className="text-sm font-medium">{notif.message}</p>
                                <span className="text-xs text-gray-400 mt-1 block">
                                    {new Date(notif.createdAt).toLocaleDateString()}
                                </span>

                                {isInvitation && !notif.isRead && (
                                    <div className="mt-2 space-x-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleInvitationAction(notif.id, notif.relatedInvitationId!, 'accept');
                                            }}
                                            className="px-3 py-1 text-xs font-semibold text-white bg-green-600 rounded-full hover:bg-green-700 transition"
                                        >
                                            Accept
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleInvitationAction(notif.id, notif.relatedInvitationId!, 'reject');
                                            }}
                                            className="px-3 py-1 text-xs font-semibold text-white bg-red-600 rounded-full hover:bg-red-700 transition"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                )}

                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};