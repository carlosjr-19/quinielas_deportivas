import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import QuinielasPage from './pages/QuinielasPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import CrearQuinielaPage from './pages/CrearQuinielaPage';
import ConfiguracionPage from './pages/ConfiguracionPage';
import QuinielaDetallePage from './pages/QuinielaDetallePage';
import ProtectedRoute from './components/ProtectedRoute';
import InvitePage from './pages/InvitePage';

import DevSyncPage from './pages/DevSyncPage';

import MundialPage from './pages/MundialPage';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen font-sans flex flex-col bg-gray-50">
        <Navbar />
        
        <div className="flex-grow flex flex-col">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/mundial" element={<MundialPage />} />
            <Route path="/quinielas" element={<QuinielasPage />} />
            <Route path="/ingresar" element={<AuthPage />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/crear-quiniela" 
              element={
                <ProtectedRoute>
                  <CrearQuinielaPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/configuracion" 
              element={
                <ProtectedRoute>
                  <ConfiguracionPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/quiniela/:codigo" 
              element={
                <ProtectedRoute>
                  <QuinielaDetallePage />
                </ProtectedRoute>
              } 
            />
            <Route path="/invite/:codigo" element={<InvitePage />} />
            {/* Ruta secreta de administrador */}
            <Route path="/dev" element={<DevSyncPage />} />
          </Routes>
        </div>
        
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
