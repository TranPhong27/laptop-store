import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { Alert } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';

export default function AdminRoute({ children }) {
  const { user, authReady } = useContext(AuthContext);

  if (!authReady) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    return <Alert variant="danger">Trang này chỉ dành cho tài khoản quản trị.</Alert>;
  }

  return children;
}