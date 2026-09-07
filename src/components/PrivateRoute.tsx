import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getToken } from '../lib/axios';
import LoadingSpinner from './ui/LoadingSpinner';

/**
 * Protects all child routes.
 * - If there's a token in localStorage but /me is still loading → show spinner.
 * - If authenticated → render child routes.
 * - Otherwise → redirect to /login.
 */
const PrivateRoute: React.FC = () => {
  const { isAuthenticated, isLoadingUser } = useAuth();
  const hasToken = Boolean(getToken());

  // While /me is being fetched (token exists but user not loaded yet)
  if (hasToken && isLoadingUser) {
    return <LoadingSpinner fullScreen text="جاري استعادة الجلسة..." />;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
