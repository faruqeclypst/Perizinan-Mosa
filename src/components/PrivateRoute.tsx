import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { RoleType } from '../utils/roles';

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles: RoleType[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, allowedRoles }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    console.log("PrivateRoute rendered. Current user:", currentUser, "Loading:", loading);
  }, [currentUser, loading]);

  if (loading) {
    console.log("Still loading...");
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    console.log("No current user, redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(currentUser.role)) {
    console.log("User role not allowed, redirecting to dashboard");
    return <Navigate to="/dashboard" replace />;
  }

  console.log("Rendering private route content. Current user:", currentUser);
  return <>{children}</>;
};

export default PrivateRoute;