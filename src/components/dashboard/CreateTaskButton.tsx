'use client';

import { useState } from 'react';
import { Modal } from '@/components/Modal';
import { CreateTaskForm } from './CreateTaskForm';
import { useTaskList } from '@/context/TaskListContext'; // <--- NEW IMPORT

// The interface CreateTaskButtonProps is removed, as props are no longer needed.

export const CreateTaskButton = () => {
    const [isOpen, setIsOpen] = useState(false);
    // 1. Get the refresh function directly from the context
    const { triggerRefresh } = useTaskList();

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                + Create New Task
            </button>
            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title="Create a New Task"
            >
                <CreateTaskForm
                    // 2. Pass the context function down to the form
                    onTaskCreated={triggerRefresh}
                    onClose={() => setIsOpen(false)}
                />
            </Modal>
        </>
    );
};