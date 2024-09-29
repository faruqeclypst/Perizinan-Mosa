import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { ROLES } from '../utils/roles';

const Dashboard: React.FC = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  switch (currentUser.role) {
    case ROLES.ADMIN:
      return <Navigate to="/admin" />;
    case ROLES.GURU_PIKET:
      return <Navigate to="/teacher" />;
    case ROLES.WAKIL:
      return <Navigate to="/deputy" />;
    default:
      return <div>Unauthorized</div>;
  }
};

export default Dashboard;