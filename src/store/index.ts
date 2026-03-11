import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
    TeacherUser,
    StudentActivity,
    ClassSession,
    Group,
    Phase,
    AppNotification,
    Language,
} from '@/types';

// ─── Auth Store ───────────────────────────────────────────────
interface AuthState {
    user: TeacherUser | null;
    studentProfile: StudentActivity | null;
    isTeacher: boolean;
    setUser: (user: TeacherUser | null) => void;
    setStudentProfile: (profile: StudentActivity | null) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            studentProfile: null,
            isTeacher: false,
            setUser: (user) => set({ user, isTeacher: user?.role === 'teacher' || user?.role === 'superadmin' }),
            setStudentProfile: (studentProfile) => set({ studentProfile }),
            logout: () => set({ user: null, studentProfile: null, isTeacher: false }),
        }),
        { name: 'fair-factory-auth' }
    )
);

// ─── Session Store ─────────────────────────────────────────────
interface SessionState {
    currentSession: ClassSession | null;
    currentGroup: Group | null;
    currentPhase: Phase;
    setSession: (session: ClassSession | null) => void;
    setGroup: (group: Group | null) => void;
    setPhase: (phase: Phase) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
    currentSession: null,
    currentGroup: null,
    currentPhase: 0,
    setSession: (currentSession) => set({ currentSession }),
    setGroup: (currentGroup) => set({ currentGroup }),
    setPhase: (currentPhase) => set({ currentPhase }),
}));

// ─── UI Store ──────────────────────────────────────────────────
interface UIState {
    language: Language;
    notifications: AppNotification[];
    unreadCount: number;
    isSidebarOpen: boolean;
    isLoading: boolean;
    loadingMessage: string;
    setLanguage: (lang: Language) => void;
    addNotification: (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
    markAllRead: () => void;
    markRead: (id: string) => void;
    clearNotifications: () => void;
    setSidebar: (open: boolean) => void;
    setLoading: (loading: boolean, message?: string) => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            language: 'ko',
            notifications: [],
            unreadCount: 0,
            isSidebarOpen: false,
            isLoading: false,
            loadingMessage: '',
            setLanguage: (language) => set({ language }),
            addNotification: (n) => set((state) => {
                const notification: AppNotification = {
                    ...n,
                    id: crypto.randomUUID(),
                    timestamp: Date.now(),
                    read: false,
                };
                return {
                    notifications: [notification, ...state.notifications].slice(0, 50),
                    unreadCount: state.unreadCount + 1,
                };
            }),
            markAllRead: () => set((state) => ({
                notifications: state.notifications.map((n) => ({ ...n, read: true })),
                unreadCount: 0,
            })),
            markRead: (id: string) => set((state) => ({
                notifications: state.notifications.map((n) => n.id === id ? { ...n, read: true } : n),
                unreadCount: Math.max(0, state.unreadCount - (state.notifications.find(n => n.id === id)?.read ? 0 : 1)),
            })),
            clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
            setSidebar: (isSidebarOpen) => set({ isSidebarOpen }),
            setLoading: (isLoading, loadingMessage = '') => set({ isLoading, loadingMessage }),
        }),
        { name: 'fair-factory-ui', partialize: (state) => ({ language: state.language }) }
    )
);
