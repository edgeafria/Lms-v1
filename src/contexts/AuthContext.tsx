import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import axios from 'axios';

// --- UPDATED User Interface ---
export interface User {
  id: string;
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'instructor' | 'student';
  avatar?: { public_id?: string | null; url?: string } | string;
  isVerified: boolean;
  twoFactorEnabled?: boolean;
  bio?: string;
  skills?: string[];
  location?: string;
  website?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
  preferences?: {
      language?: string;
      timezone?: string;
      notifications?: { email?: boolean; push?: boolean; };
  };
  loginStreak?: number; // <-- ADDED
}
// ----------------------------

interface RegisterData { name: string; email: string; password: string; role: 'instructor' | 'student'; }
interface AuthApiResponse { success: boolean; token: string; user: User; message?: string; errors?: any[]; }
interface ProfileApiResponse { success: boolean; data: User; message?: string; }


const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const useAuth = () => { const context = useContext(AuthContext); if (context === undefined) { throw new Error('useAuth must be used within an AuthProvider'); } return context; };

const API_BASE_URL = 'http://localhost:5000/api';
export const axiosInstance = axios.create({ baseURL: API_BASE_URL });
axiosInstance.interceptors.request.use( (config) => { const token = localStorage.getItem('token'); if (token && config.headers) { config.headers['Authorization'] = `Bearer ${token}`; } return config; }, (error) => Promise.reject(error) );

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  updateUserState: (updatedUserFields: Partial<User> | { data: User }) => void; // Keep this
  loading: boolean;
  isAuthenticating: boolean;
  isAuthenticated: boolean;
  token: string | null;
}

interface AuthProviderProps { children: ReactNode; }

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const saveToken = (newToken: string | null) => {
      setToken(newToken);
      if (newToken) { localStorage.setItem('token', newToken); }
      else { localStorage.removeItem('token'); }
  };

  const checkAuthState = useCallback(async () => {
    const storedToken = localStorage.getItem('token');
    try {
        if (storedToken) {
            if (token !== storedToken) setToken(storedToken);
            const response = await axiosInstance.get<ProfileApiResponse>('/users/profile');
            const userDataFromProfile = response.data.data;
            if (response.data.success && userDataFromProfile) {
                // loginStreak will be included here from the profile fetch
                setUser({ ...userDataFromProfile, id: userDataFromProfile._id });
            } else { saveToken(null); setUser(null); }
        } else {
            if (user !== null) setUser(null);
            if (token !== null) setToken(null);
        }
    } catch (error) { console.error("(AuthProvider) Error during auth check:", error); saveToken(null); setUser(null); }
    finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once

  useEffect(() => { checkAuthState(); }, [checkAuthState]);

  const login = async (email: string, password: string) => {
    setIsAuthenticating(true);
    try {
      // loginStreak is now included in response.data.user
      const response = await axios.post<AuthApiResponse>(`${API_BASE_URL}/auth/login`, { email, password });
      if (response.data.success && response.data.token && response.data.user) {
          saveToken(response.data.token);
          const userData = response.data.user.id ? response.data.user : { ...response.data.user, id: response.data.user._id };
          setUser(userData);
      } else { throw new Error(response.data.message || 'Login failed.'); }
    } catch (error) {
        let errMsg = 'Login failed.'; if (axios.isAxiosError(error) && error.response?.data?.message) errMsg = error.response.data.message; else if (error instanceof Error) errMsg = error.message;
        console.error("Login Context error:", error); throw new Error(errMsg);
    } finally { setIsAuthenticating(false); }
  };

  const register = async (userData: RegisterData) => {
    setIsAuthenticating(true);
    try {
      const response = await axios.post<{success: boolean; message?: string; errors?: any[]}>(`${API_BASE_URL}/auth/register`, userData);
      if (!response.data.success) {
          if (response.data.errors) { throw new Error(`Registration failed: ${response.data.errors.map((e: any) => e.msg).join(', ')}`); }
          throw new Error(response.data.message || 'Registration failed.');
      }
    } catch (error) {
        let errMsg = 'Registration failed.'; if (axios.isAxiosError(error) && error.response?.data?.message) errMsg = error.response.data.message; else if (error instanceof Error) errMsg = error.message;
        console.error("Register Context error:", error); throw new Error(errMsg);
    } finally { setIsAuthenticating(false); }
  };

  const logout = () => { saveToken(null); setUser(null); };

  const loginWithGoogle = async (credential: string) => {
    setIsAuthenticating(true);
    try {
      // loginStreak is now included in response.data.user
      const response = await axios.post<AuthApiResponse>(`${API_BASE_URL}/auth/google`, { credential });
      if (response.data.success && response.data.token && response.data.user) {
        saveToken(response.data.token);
        setUser(response.data.user);
      } else {
        throw new Error(response.data.message || 'Google login failed.');
      }
    } catch (error) {
        let errorMessage = 'Google login failed.'; if (axios.isAxiosError(error) && error.response?.data?.message) errorMessage = error.response.data.message; else if (error instanceof Error) errorMessage = error.message;
        console.error("Google Login Context error:", error); throw new Error(errorMessage);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const updateUserState = (updatedUserFields: Partial<User> | { data: User }) => {
      setUser(prevUser => {
          if (!prevUser) return null;
          let updatedData: Partial<User>;
          if ('data' in updatedUserFields && (updatedUserFields as any).data) {
             updatedData = (updatedUserFields as any).data;
          } else {
             updatedData = updatedUserFields as Partial<User>;
          }
          const updatedUser = { ...prevUser, ...updatedData };
           if (updatedUser._id && !updatedUser.id) { updatedUser.id = updatedUser._id; }
           console.log("Updating context user state:", updatedUser);
           return updatedUser;
      });
  };

  const value: AuthContextType = {
    user, token, login, logout, register, loginWithGoogle,
    updateUserState,
    loading, isAuthenticating, isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500"></div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};