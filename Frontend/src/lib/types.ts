// Define user roles matching your backend Prisma schema
export enum Role {
    ADMIN = 'ADMIN',
    USER = 'USER',
}

export enum TaskStatus {
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
}

export enum InvitationStatus {
    PENDING = 'PENDING',
    ACCEPTED = 'ACCEPTED',
    REJECTED = 'REJECTED',
}

export interface User {
    id: string;
    email: string;
    name: string;
    role: Role;
    createdAt?: string;
}

export interface AssignedUser {
    id: string;
    name: string;
    email: string;
}

export interface SubTask {
    id: string;
    title: string;
    description: string | null;
    taskId: string;
    assignedUserId: string;
    assignedUser: AssignedUser;
    status: TaskStatus;
    dueDate: string | null;
}

export interface Task {
    id: string;
    title: string;
    description: string | null;
    creatorId: string;
    creator: { id: string; name: string };
    assignedUsers: AssignedUser[];
    subTasks: SubTask[];
    status: TaskStatus;
    invitations: TaskInvitation[];
    createdAt: string;
    updatedAt: string;
}

export interface TaskInvitation {
    id: string;
    taskId: string;
    invitedUserId: string;
    invitedByUserId: string;
    invitedByUser: { name: string };
    status: InvitationStatus;
}

export interface Notification {
    id: string;
    userId: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    relatedTaskId?: string;
    relatedInvitationId?: string;
    type?: 'TASK_INVITATION' | 'INVITATION_RESPONSE' | 'OTHER' | string;
}