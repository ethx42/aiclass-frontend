import { useAuthStore } from '../stores/auth-store';
import { login as loginApi, signup as signupApi, logout as logoutApi, LoginCredentials, SignupData } from '../auth/auth-utils';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
  const router = useRouter();
  const { isAuthenticated, user, setAuth, clearAuth, initializeAuth } = useAuthStore();

  const login = async (credentials: LoginCredentials) => {
    const result = await loginApi(credentials);
    
    if (result.success && result.accessToken && result.authUserId && result.user) {
      setAuth(result.accessToken, result.authUserId, result.user);
      router.replace('/dashboard');
      return { success: true };
    }
    
    return { success: false, error: result.error };
  };

  const signup = async (data: SignupData) => {
    const result = await signupApi(data);
    
    if (result.success && result.accessToken && result.authUserId && result.user) {
      setAuth(result.accessToken, result.authUserId, result.user);
      router.replace('/dashboard');
      return { success: true };
    }
    
    return { success: false, error: result.error };
  };

  const logout = async () => {
    await logoutApi();
    clearAuth();
    router.push('/login');
  };

  return {
    isAuthenticated,
    user,
    login,
    signup,
    logout,
    initializeAuth,
  };
};

