import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUsuario } from '../utils/auth';

const AuthPage = () => {
  const [authMode, setAuthMode] = useState('login'); // 'login', 'register', 'forgot'
  const [formData, setFormData] = useState({ nombre: '', pin: '', confirm_pin: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    let url = '';
    if (authMode === 'login') url = '/api/usuarios/login';
    else if (authMode === 'register') url = '/api/usuarios/registro';
    else if (authMode === 'forgot') url = '/api/usuarios/olvido-pin';
    
    // Validación local
    if (authMode !== 'login') {
      if (formData.pin !== formData.confirm_pin) {
        return setError('Los PIN no coinciden.');
      }
      if (!/^\d{4,6}$/.test(formData.pin)) {
        return setError('El PIN debe ser numérico y tener entre 4 y 6 dígitos.');
      }
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authMode === 'forgot' ? { nombre: formData.nombre, nuevo_pin: formData.pin } : formData)
      });
      
      let data = {};
      const textResponse = await response.text();
      try {
        if (textResponse) {
          data = JSON.parse(textResponse);
        }
      } catch (e) {
        console.error("Error al procesar JSON:", textResponse);
      }
      
      if (!response.ok) {
        if (response.status === 504 || response.status === 502) {
            throw new Error('El servidor backend está apagado o no responde. Por favor, asegúrate de haber ejecutado uvicorn.');
        }
        throw new Error(data.detail || 'Ocurrió un error en el servidor');
      }

      // Éxito: Guardamos en localStorage y redirigimos
      loginUsuario(data);
      
      const inviteCode = localStorage.getItem('inviteCode');
      if (inviteCode) {
        localStorage.removeItem('inviteCode');
        navigate(`/invite/${inviteCode}`);
      } else {
        navigate('/dashboard');
      }
      
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-[100svh] flex items-center justify-center bg-gray-50 pt-20 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/Logo_quinielas.png" alt="Logo" className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-3xl font-extrabold text-gray-900">
            {authMode === 'login' ? 'Inicia Sesión' : authMode === 'register' ? 'Crea tu Cuenta' : 'Recupera tu PIN'}
          </h2>
          <p className="text-gray-500 mt-2">
            {authMode === 'login' ? 'Ingresa para gestionar tus quinielas' : authMode === 'register' ? 'Únete a la plataforma definitiva de pronósticos' : 'Ingresa tu usuario y crea un nuevo PIN'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm font-medium text-center border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre de Usuario</label>
            <input 
              type="text" 
              name="nombre" 
              value={formData.nombre} 
              onChange={handleChange} 
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
              placeholder="Ej. Carlos123"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              {authMode === 'forgot' ? 'Nuevo PIN Secreto (4-6 dígitos)' : 'PIN Secreto (4-6 dígitos)'}
            </label>
            <input 
              type="password" 
              name="pin" 
              value={formData.pin} 
              onChange={handleChange} 
              required
              maxLength="6"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
              placeholder="••••"
            />
          </div>
          
          {authMode !== 'login' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {authMode === 'forgot' ? 'Confirmar Nuevo PIN' : 'Confirmar PIN'}
              </label>
              <input 
                type="password" 
                name="confirm_pin" 
                value={formData.confirm_pin} 
                onChange={handleChange} 
                required
                maxLength="6"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                placeholder="••••"
              />
            </div>
          )}

          <button 
            type="submit" 
            className="w-full bg-[#111111] hover:bg-black text-white font-bold py-3.5 rounded-lg shadow-md transition-all text-lg mt-4"
          >
            {authMode === 'login' ? 'Ingresar' : authMode === 'register' ? 'Registrarme' : 'Actualizar PIN e Ingresar'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-gray-100 pt-6 space-y-3">
          {authMode === 'login' && (
            <p className="text-sm">
              <button 
                type="button"
                onClick={() => {
                  setAuthMode('forgot');
                  setError('');
                  setFormData({ nombre: formData.nombre, pin: '', confirm_pin: '' });
                }}
                className="text-blue-600 font-medium hover:underline"
              >
                ¿Olvidaste tu PIN?
              </button>
            </p>
          )}

          <p className="text-gray-600">
            {authMode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes una cuenta?'}
            <button 
              type="button"
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                setError('');
                setFormData({ nombre: '', pin: '', confirm_pin: '' });
              }}
              className="ml-2 text-blue-600 font-bold hover:underline"
            >
              {authMode === 'login' ? 'Regístrate aquí' : 'Inicia Sesión'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
