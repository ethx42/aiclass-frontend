import { apiClient } from './client';
import { usersApi } from './users';
import { ApiResponse, User, UserRole, roleToApiFormat } from '@/src/types/api';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Validate at runtime (not build time)
const validateSupabaseConfig = () => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase environment variables. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
};

interface SignupData {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
}

interface LoginData {
  email: string;
  password: string;
}

interface SupabaseAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    user_metadata: {
      full_name: string;
      role: string;
    };
  };
}

export const authApi = {
  // Signup with Supabase and create user in our DB
  signup: async (data: SignupData) => {
    validateSupabaseConfig();
    try {
      // Step 1: Create user in Supabase Auth
      const supabaseResponse = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          data: {
            full_name: data.fullName,
            role: roleToApiFormat(data.role),
          },
        }),
      });

      if (!supabaseResponse.ok) {
        const errorData = await supabaseResponse.json();
        throw new Error(errorData.message || 'Failed to create account');
      }

      const authResult: SupabaseAuthResponse = await supabaseResponse.json();

      // Step 2: Create user profile in our database
      const userResponse = await usersApi.create({
        authUserId: authResult.user.id,
        fullName: data.fullName,
        email: data.email,
        role: roleToApiFormat(data.role) as any,
        metadata: {},
      });

      return {
        token: authResult.access_token,
        user: userResponse.data,
      };
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  },

  // Login with Supabase
  login: async (data: LoginData) => {
    validateSupabaseConfig();
    try {
      const supabaseResponse = await fetch(
        `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
        {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY || '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: data.email,
            password: data.password,
          }),
        }
      );

      if (!supabaseResponse.ok) {
        const errorData = await supabaseResponse.json();
        throw new Error(errorData.error_description || 'Invalid credentials');
      }

      const authResult: SupabaseAuthResponse = await supabaseResponse.json();

      // Get user profile from our database
      const userResponse = await usersApi.getByAuthUserId(authResult.user.id);

      return {
        token: authResult.access_token,
        authUserId: authResult.user.id,
        user: userResponse.data,
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Logout
  logout: async (token: string) => {
    validateSupabaseConfig();
    try {
      await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY || '',
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },
};

