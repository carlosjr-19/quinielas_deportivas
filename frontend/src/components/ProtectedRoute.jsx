import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAutenticado } from '../utils/auth';

const ProtectedRoute = ({ children }) => {
  if (!isAutenticado()) {
    // Si no está logueado, redirigir al login
    return <Navigate to="/ingresar" replace />;
  }

  // Si está logueado, mostrar el contenido
  return children;
};

export default ProtectedRoute;
