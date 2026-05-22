import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ConfiguracionPage = () => {
  const [nombre, setNombre] = useState(JSON.parse(localStorage.getItem('usuario'))?.nombre || '');
  const [pinActual, setPinActual] = useState('');
  const [nuevoPin, setNuevoPin] = useState('');
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setExito('');
    
    if (nuevoPin && (nuevoPin.length < 4 || nuevoPin.length > 6)) {
        setError('El nuevo PIN debe tener entre 4 y 6 dígitos.');
        return;
    }

    try {
      const usuarioLocal = JSON.parse(localStorage.getItem('usuario'));
      const response = await fetch(`/api/usuarios/${usuarioLocal.id}/configuracion`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          pin_actual: pinActual,
          nuevo_pin: nuevoPin
        })
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Error al actualizar configuración');
      }

      setExito('Configuración actualizada correctamente');
      setPinActual('');
      setNuevoPin('');
      // Actualizar localStorage
      localStorage.setItem('usuario', JSON.stringify(data));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen pt-20 bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-[#1c803c]">Configuración de Cuenta</h2>
        
        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}
        {exito && <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-sm">{exito}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de Usuario</label>
            <input 
              type="text" 
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full p-2 border rounded focus:ring-[#1c803c] focus:border-[#1c803c]"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PIN Actual (Requerido)</label>
            <input 
              type="password" 
              value={pinActual}
              onChange={(e) => setPinActual(e.target.value)}
              className="w-full p-2 border rounded focus:ring-[#1c803c] focus:border-[#1c803c]"
              maxLength="6"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nuevo PIN (Opcional)</label>
            <input 
              type="password" 
              value={nuevoPin}
              onChange={(e) => setNuevoPin(e.target.value)}
              className="w-full p-2 border rounded focus:ring-[#1c803c] focus:border-[#1c803c]"
              maxLength="6"
            />
            <p className="text-xs text-gray-500 mt-1">Déjalo en blanco si no quieres cambiarlo</p>
          </div>
          
          <button 
            type="submit"
            className="w-full bg-[#1c803c] hover:bg-[#14602a] text-white py-2 rounded font-semibold transition-colors"
          >
            Guardar Cambios
          </button>
        </form>
      </div>
    </div>
  );
};

export default ConfiguracionPage;
