import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');
    const name = localStorage.getItem('name');
    const role = localStorage.getItem('role');
    if (token) setUser({ token, email, name, role });
    setAuthReady(true);
  }, []);

  const login = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('email', data.email);
    localStorage.setItem('name', data.name);
    localStorage.setItem('role', data.role || 'user');
    setUser({ token: data.token, email: data.email, name: data.name, role: data.role });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('name');
    localStorage.removeItem('role');
    setUser(null);
  };

  const register = async (payload) => {
    const res = await api.post('/api/auth/register', payload);
    login(res.data);
    return res.data;
  };

  const signin = async (payload) => {
    const res = await api.post('/api/auth/login', payload);
    login(res.data);
    return res.data;
  };

  const googleLogin = async (credential) => {
    const res = await api.post('/api/auth/google', { credential });
    login(res.data);
    return res.data;
  };

  return (
    <AuthContext.Provider value={{ user, authReady, login: signin, logout, register, googleLogin }}>
      {children}
    </AuthContext.Provider>
  );
}
