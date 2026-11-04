import type { TaskInput, ProjectInput, NoteInput } from '@nexora/shared';
export interface User {
  _id: string;
  name: string;
  email: string;
  verified: boolean;
  avatar: string;
  theme: string;
  notifications: { email: boolean; activity: boolean };
}
export interface Workspace {
  _id: string;
  name: string;
  members: { userId: string; role: 'owner' | 'admin' | 'member' }[];
}
export interface Member {
  userId: Pick<User, '_id' | 'name' | 'email' | 'avatar'>;
  role: 'owner' | 'admin' | 'member';
}
export interface Project extends ProjectInput {
  _id: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}
export interface Task extends TaskInput {
  _id: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}
export interface Note extends NoteInput {
  _id: string;
  updatedAt: string;
  createdAt: string;
}
export interface Activity {
  _id: string;
  message: string;
  href: string;
  createdAt: string;
  createdBy: Pick<User, 'name' | 'avatar'> | null;
}
export interface Notification {
  _id: string;
  message: string;
  href: string;
  read: boolean;
  createdAt: string;
}
export interface Analytics {
  totalTasks: number;
  completed: number;
  activeProjects: number;
  totalProjects: number;
  overdue: number;
  completionRate: number;
  activityCount: number;
  distribution: { status: string; count: number }[];
  trends: { date: string; label: string; completed: number; created: number }[];
  projects: (Project & { total: number; completed: number; progress: number })[];
  upcoming: Task[];
  suggestions: string[];
}
export interface Conversation {
  _id: string;
  title: string;
  updatedAt: string;
  messages?: { _id: string; role: 'user' | 'assistant'; content: string; createdAt: string }[];
}
