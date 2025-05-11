import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { verifyToken } from '@/lib/auth';

interface User {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  register: (token: string, user: User) => void;
  isAuthenticated: boolean;
  loading: boolean;
  isGuest?: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  register: () => {},
  isAuthenticated: false,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    // ローカルストレージからユーザー情報を読み込む
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        // トークンの検証
        const decoded = verifyToken(storedToken);
        if (decoded && decoded.id) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
          setIsGuest(!!decoded.isGuest);
        } else {
          // トークンが無効な場合はクリア
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setIsGuest(false);
        }
      } catch (error) {
        console.error('Token verification failed:', error);
        // トークンが無効な場合はクリア
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsGuest(false);
      }
    } else {
      setIsGuest(false);
    }
    setLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    try {
      // トークンの検証
      const decoded = verifyToken(newToken);
      if (decoded && decoded.id) {
    setToken(newToken);
    setUser(newUser);
        setIsGuest(!!decoded.isGuest);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
      } else {
        throw new Error('Invalid token');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setIsGuest(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/auth/login');
  };

  const register = (newToken: string, newUser: User) => {
    try {
      // トークンの検証
      const decoded = verifyToken(newToken);
      if (decoded && decoded.id) {
    setToken(newToken);
    setUser(newUser);
        setIsGuest(!!decoded.isGuest);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
      } else {
        throw new Error('Invalid token');
      }
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        register,
        isAuthenticated: !!user,
        loading,
        isGuest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 