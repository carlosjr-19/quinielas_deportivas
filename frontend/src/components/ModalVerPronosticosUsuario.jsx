import React, { useState, useEffect } from 'react';

const ModalVerPronosticosUsuario = ({ usuario, onClose, getTeamFlagUrl }) => {
  const [pronosticos, setPronosticos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (usuario && usuario.usuario_quiniela_id) {
      fetch(`/api/pronosticos/usuario/${usuario.usuario_quiniela_id}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setPronosticos(data);
          }
        })
        .catch(err => console.error("Error al cargar pronósticos del usuario:", err))
        .finally(() => setCargando(false));
    }
  }, [usuario]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-[#1c803c] px-6 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </div>
            <div>
              <h3 className="text-white font-bold text-xl leading-tight">Pronósticos de {usuario.nombre}</h3>
              <p className="text-green-100 text-sm font-medium">Puntos Totales: {usuario.puntos_totales || 0} pts</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto bg-gray-50 flex-1">
          {cargando ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#1c803c]"></div>
              <p className="mt-4 text-gray-500 font-medium">Cargando pronósticos...</p>
            </div>
          ) : pronosticos.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pronosticos.map(p => (
                <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm relative">
                  
                  <div className="flex justify-between items-center mb-3 pr-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {new Date(p.fecha_partido).toLocaleDateString('es-ES', {day: '2-digit', month: 'short'})} · {new Date(p.fecha_partido).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                    </span>
                    <span className="text-xs font-bold bg-green-100 text-green-800 px-2.5 py-1 rounded-full border border-green-200">
                      {p.puntos_obtenidos !== null ? `${p.puntos_obtenidos} pts` : 'Pendiente'}
                    </span>
                  </div>
                  
                  {p.texto_libre ? (
                    <div className="mt-4 bg-blue-50 p-4 rounded-lg border border-blue-100 flex flex-col items-center justify-center text-center">
                      <span className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-2">Predicción Libre</span>
                      <p className="text-gray-800 font-medium italic">"{p.texto_libre}"</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between mt-4 bg-gray-50 p-3 rounded-lg border border-gray-100 flex-wrap sm:flex-nowrap gap-2">
                      <div className="flex flex-col items-center flex-1 min-w-0">
                        {getTeamFlagUrl && getTeamFlagUrl(p.equipo_local) ? (
                          <img src={getTeamFlagUrl(p.equipo_local)} alt={p.equipo_local} className="w-8 h-auto shadow-sm rounded-sm mb-1" />
                        ) : (
                          <span className="text-2xl mb-1">🏳️</span>
                        )}
                        <span className="text-sm font-bold text-gray-700 truncate w-full text-center">{p.equipo_local}</span>
                      </div>
                      
                      <div className="px-4 py-2 bg-white rounded-md border-2 border-gray-200 shadow-sm mx-2 shrink-0">
                        <span className="text-xl font-black text-gray-800 tracking-widest">{p.goles_local}-{p.goles_visitante}</span>
                      </div>
                      
                      <div className="flex flex-col items-center flex-1 min-w-0">
                        {getTeamFlagUrl && getTeamFlagUrl(p.equipo_visitante) ? (
                          <img src={getTeamFlagUrl(p.equipo_visitante)} alt={p.equipo_visitante} className="w-8 h-auto shadow-sm rounded-sm mb-1" />
                        ) : (
                          <span className="text-2xl mb-1">🏳️</span>
                        )}
                        <span className="text-sm font-bold text-gray-700 truncate w-full text-center">{p.equipo_visitante}</span>
                      </div>
                    </div>
                  )}
                  
                  {p.estado_partido === 'FINALIZADO' && (
                    <div className="mt-3 text-center bg-green-50 p-2 rounded-lg border border-green-100">
                      <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest mb-1">Resultado Final</p>
                      <p className="text-sm font-black text-gray-800 tracking-wider">{p.goles_local_real} - {p.goles_visitante_real}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-200">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">No hay pronósticos</h3>
              <p className="text-gray-500 max-w-sm mx-auto">Este usuario aún no ha realizado ningún pronóstico en la quiniela.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white border-t px-6 py-4 flex justify-end shrink-0">
          <button 
            onClick={onClose}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-6 rounded-lg transition-colors border border-gray-300 shadow-sm"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};

export default ModalVerPronosticosUsuario;
