'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface TaskListContextType {
    shouldRefresh: boolean;
    triggerRefresh: () => void;
}

const TaskListContext = createContext<TaskListContextType | undefined>(undefined);

export const TaskListProvider = ({ children }: { children: ReactNode }) => {
    const [shouldRefresh, setShouldRefresh] = useState(false);

    const triggerRefresh = () => {
        // Toggle state to force TaskList to re-fetch data
        setShouldRefresh(prev => !prev);
    };

    return (
        <TaskListContext.Provider value={{ shouldRefresh, triggerRefresh }}>
            {children}
        </TaskListContext.Provider>
    );
};

export const useTaskList = () => {
    const context = useContext(TaskListContext);
    if (context === undefined) {
        throw new Error('useTaskList must be used within a TaskListProvider');
    }
    return context;
};