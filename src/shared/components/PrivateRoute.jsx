import React from 'react';
import { useKeycloak } from '@react-keycloak/web';
import { Navigate, useLocation } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const { keycloak, initialized } = useKeycloak();
  const location = useLocation();

  if (!initialized) {
    return <div>Loading...</div>;
  }

  return keycloak.authenticated ? children : <Navigate to="/login" state={{ from: location }} replace />;
};

export default PrivateRoute;
