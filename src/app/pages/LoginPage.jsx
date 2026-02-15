import React from 'react';
import { useKeycloak } from '@react-keycloak/web';
import { Navigate, useLocation } from 'react-router-dom';

const LoginPage = () => {
  const { keycloak, initialized } = useKeycloak();
  const location = useLocation();

  if (!initialized) {
    return <div>Loading...</div>;
  }

  // If user is already authenticated, redirect them
  if (keycloak.authenticated) {
    const from = location.state?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  const handleLogin = () => {
    keycloak.login();
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <h1>Welcome to AGDev</h1>
        <p>Please sign in to continue.</p>
        <button onClick={handleLogin} style={{ padding: '10px 20px', fontSize: '16px' }}>
          Sign In
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
