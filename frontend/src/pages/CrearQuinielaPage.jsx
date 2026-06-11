import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsuarioLogueado } from '../utils/auth';

const CrearQuinielaPage = () => {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    torneo_id: 'WC-2026', // ID correcto del torneo
    reglas: '',
    puntos_exacto: 3,
    puntos_ganador: 1
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const user = getUsuarioLogueado();
    if (!user) {
      navigate('/ingresar');
    } else {
      setUsuario(user);
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'number' ? parseInt(value) || 0 : value 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const payload = {
        ...formData,
        creador_id: usuario.id
      };

      const res = await fetch('/api/quinielas/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error('Error al crear la quiniela');
      
      const data = await res.json();
      navigate('/dashboard'); // Volver al dashboard donde verá su código
      
    } catch (err) {
      setError(err.message);
    }
  };

  if (!usuario) return null;

  return (
    <div className="min-h-[100svh] bg-gray-50 pt-28 md:pt-32 pb-16 flex justify-center">
      <div className="w-full max-w-2xl px-4 sm:px-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Crear Nueva Quiniela</h2>
          <p className="text-gray-500 mb-8">Configura tu torneo privado y luego invita a tus amigos usando el código generado.</p>
          
          {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre de tu Quiniela</label>
              <input 
                type="text" 
                name="nombre" 
                value={formData.nombre} 
                onChange={handleChange} 
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                placeholder="Ej. Los Reyes del Fútbol"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Torneo a Pronosticar</label>
              <select 
                name="torneo_id" 
                value={formData.torneo_id} 
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none bg-white"
              >
                <option value="WC-2026">Mundial 2026</option>
                <option value="LIBRE">Quiniela Libre (Sin partidos predefinidos)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Puntos por resultado exacto</label>
                <input 
                  type="number" 
                  name="puntos_exacto" 
                  value={formData.puntos_exacto} 
                  onChange={handleChange} 
                  min="0"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Puntos por acertar ganador/empate</label>
                <input 
                  type="number" 
                  name="puntos_ganador" 
                  value={formData.puntos_ganador} 
                  onChange={handleChange} 
                  min="0"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Reglas (Opcional)</label>
              <textarea 
                name="reglas" 
                value={formData.reglas} 
                onChange={handleChange} 
                rows="4"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none"
                placeholder="Explica cómo se repartirán los premios o reglas internas..."
              ></textarea>
            </div>

            <div className="flex gap-4 pt-4 border-t border-gray-100">
              <button type="button" onClick={() => navigate('/dashboard')} className="px-6 py-3 text-gray-600 font-semibold hover:bg-gray-100 rounded-lg transition-colors">
                Cancelar
              </button>
              <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-md transition-all">
                Crear y Generar Código
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CrearQuinielaPage;
