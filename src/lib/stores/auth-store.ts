import { create } from 'zustand';
import { User, UserRole } from '@/src/types/api';

interface AuthState {
  // Auth state
  isAuthenticated: boolean;
  token: string | null;
  authUserId: string | null;
  user: User | null;
  
  // Actions
  setAuth: (token: string, authUserId: string, user: User) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // Initial state
  isAuthenticated: false,
  token: null,
  authUserId: null,
  user: null,

  // Set authentication
  setAuth: (token: string, authUserId: string, user: User) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_data', JSON.stringify(user));
    }
    set({
      isAuthenticated: true,
      token,
      authUserId,
      user,
    });
  },

  // Update user data
  setUser: (user: User) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_data', JSON.stringify(user));
    }
    set({ user });
  },

  // Clear authentication
  clearAuth: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
    }
    set({
      isAuthenticated: false,
      token: null,
      authUserId: null,
      user: null,
    });
  },

  // Initialize auth from localStorage
  initializeAuth: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      const userData = localStorage.getItem('user_data');
      
      if (token && userData) {
        try {
          const user = JSON.parse(userData) as User;
          set({
            isAuthenticated: true,
            token,
            authUserId: user.authUserId,
            user,
          });
        } catch (error) {
          console.error('Failed to parse user data:', error);
          // Clear invalid data
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
        }
      }
    }
  },
}));

// Helper to check if user is teacher
export const useIsTeacher = () => {
  const user = useAuthStore((state) => state.user);
  return user?.role === UserRole.TEACHER;
};

// Helper to check if user is student
export const useIsStudent = () => {
  const user = useAuthStore((state) => state.user);
  return user?.role === UserRole.STUDENT;
};

