import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'USER';
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  apiFetch: (path: string, options?: RequestInit) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';

export const buildApiUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('culttrack_token'));
  const [loading, setLoading] = useState(true);

  // Helper function to hit API paths with auth headers automatically injected
  const apiFetch = async (path: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    
    // Inject Authorization header if token exists
    const currentToken = localStorage.getItem('culttrack_token');
    if (currentToken) {
      headers.set('Authorization', `Bearer ${currentToken}`);
    }
    
    // Default to JSON body types
    if (options.body && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(buildApiUrl(path), { ...options, headers });
    
    if (response.status === 401 || response.status === 403) {
      // If token expired or unauthorized, trigger automatic client logout
      if (token) {
        logout();
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  };

  useEffect(() => {
    const fetchUser = async () => {
      const storedToken = localStorage.getItem('culttrack_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const profile = await apiFetch('/api/v1/auth/me');
        setUser(profile);
      } catch (error) {
        console.error('Failed to load profile from stored token', error);
        localStorage.removeItem('culttrack_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('culttrack_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('culttrack_token');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser, apiFetch }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
