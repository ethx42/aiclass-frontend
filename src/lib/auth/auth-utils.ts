import { supabase } from './supabase';
import { usersApi } from '../api/users';
import { User, UserRole } from '@/src/types/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData extends LoginCredentials {
  fullName: string;
  role: UserRole;
}

export interface AuthResult {
  success: boolean;
  accessToken?: string;
  authUserId?: string;
  user?: User;
  error?: string;
}

/**
 * Login with email and password
 */
export const login = async ({ email, password }: LoginCredentials): Promise<AuthResult> => {
  try {
    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.session) {
      return {
        success: false,
        error: authError?.message || 'Login failed',
      };
    }

    const accessToken = authData.session.access_token;
    const authUserId = authData.user.id;

    // Store token in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', accessToken);
    }

    // Fetch user profile from backend
    try {
      const userResponse = await usersApi.getByAuthUserId(authUserId);
      
      if (userResponse.success && userResponse.data) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('user_data', JSON.stringify(userResponse.data));
        }

        return {
          success: true,
          accessToken,
          authUserId,
          user: userResponse.data,
        };
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }

    return {
      success: true,
      accessToken,
      authUserId,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
    };
  }
};

/**
 * Signup new user
 */
export const signup = async ({ email, password, fullName, role }: SignupData): Promise<AuthResult> => {
  try {
    // Create auth user in Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
        },
      },
    });

    if (authError || !authData.user) {
      return {
        success: false,
        error: authError?.message || 'Signup failed',
      };
    }

    const authUserId = authData.user.id;
    const accessToken = authData.session?.access_token;

    // Create user profile in backend
    try {
      const userResponse = await usersApi.create({
        authUserId,
        fullName,
        email,
        role,
      });

      if (userResponse.success && userResponse.data && accessToken) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', accessToken);
          localStorage.setItem('user_data', JSON.stringify(userResponse.data));
        }

        return {
          success: true,
          accessToken,
          authUserId,
          user: userResponse.data,
        };
      }
    } catch (error) {
      console.error('Failed to create user profile:', error);
    }

    return {
      success: false,
      error: 'Failed to create user profile',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
    };
  }
};

/**
 * Logout current user
 */
export const logout = async (): Promise<void> => {
  await supabase.auth.signOut();
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  }
};

/**
 * Get current session
 */
export const getCurrentSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const session = await getCurrentSession();
  return !!session;
};

