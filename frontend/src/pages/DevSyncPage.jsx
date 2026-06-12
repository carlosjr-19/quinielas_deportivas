import React, { useState } from 'react';

const DevSyncPage = () => {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);

  const handleSync = async () => {
    setLoading(true);
    setResultado(null);
    try {
      const res = await fetch('/api/torneos/sync', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setResultado({ tipo: 'éxito', mensaje: `Sincronización completa. Nuevos: ${data.nuevos}, Actualizados: ${data.actualizados}` });
      } else {
        setResultado({ tipo: 'error', mensaje: data.detail || 'Error al sincronizar' });
      }
    } catch (error) {
      setResultado({ tipo: 'error', mensaje: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100svh] flex flex-col justify-center items-center bg-gray-900 text-white p-4">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-red-500 mb-2">Zona de Peligro</h1>
        <p className="text-gray-400 mb-8 text-sm">
          Esta ruta es únicamente para el administrador. Al sincronizar, la base de datos se actualizará con la información del archivo world_cup.json, sobreescribiendo resultados previos y calculando puntos.
        </p>
        
        <button 
          onClick={handleSync}
          disabled={loading}
          className={`w-full py-4 text-xl font-black rounded-lg shadow-lg uppercase tracking-wider transition-all
            ${loading ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 text-white active:scale-95'}
          `}
        >
          {loading ? 'Sincronizando...' : 'FORZAR SINCRONIZACIÓN'}
        </button>

        {resultado && (
          <div className={`mt-6 p-4 rounded-lg font-mono text-sm break-words
            ${resultado.tipo === 'éxito' ? 'bg-green-900/50 text-green-300 border border-green-800' : 'bg-red-900/50 text-red-300 border border-red-800'}
          `}>
            {resultado.mensaje}
          </div>
        )}
      </div>
    </div>
  );
};

export default DevSyncPage;
