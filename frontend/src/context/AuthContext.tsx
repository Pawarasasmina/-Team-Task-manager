import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user and token from localStorage and fetch fresh data
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      
      // Fetch fresh user data with populated team
      axios.get('http://localhost:5000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${storedToken}`
        }
      })
      .then(response => {
        if (response.data.success && response.data.user) {
          const freshUser = response.data.user;
          const userData = {
            id: freshUser._id || freshUser.id,
            name: freshUser.name,
            email: freshUser.email,
            contactNumber: freshUser.contactNumber,
            role: freshUser.role,
            isPasswordChanged: freshUser.isPasswordChanged,
            team: freshUser.team,
            createdAt: freshUser.createdAt,
            updatedAt: freshUser.updatedAt
          };
          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);
        } else {
          setUser(JSON.parse(storedUser));
        }
        setLoading(false);
      })
      .catch(() => {
        // If fetch fails, use stored user
        setUser(JSON.parse(storedUser));
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, loading }}>
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
