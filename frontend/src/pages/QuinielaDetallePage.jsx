import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTeamFlagUrl } from '../utils/helpers';

const QuinielaDetallePage = () => {
  const { codigo } = useParams();
  const navigate = useNavigate();
  const [quiniela, setQuiniela] = useState(null);
  const [partidos, setPartidos] = useState([]);
  const [miembros, setMiembros] = useState([]);
  const [feed, setFeed] = useState([]);
  const [activeTab, setActiveTab] = useState('pronosticos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const usuarioLocal = JSON.parse(localStorage.getItem('usuario'));

  useEffect(() => {
    cargarDatos();
  }, [codigo]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      // 1. Detalles de Quiniela
      const resQ = await fetch(`/api/quinielas/${codigo}`);
      if (!resQ.ok) throw new Error('No se pudo cargar la quiniela');
      const dataQ = await resQ.json();
      setQuiniela(dataQ);

      // 2. Miembros y mi rol
      const resM = await fetch(`/api/quinielas/${codigo}/miembros`);
      const dataM = await resM.json();
      setMiembros(dataM);

      // 3. Partidos
      const resP = await fetch(`/api/torneos/${dataQ.torneo_id}/partidos`);
      const dataP = await resP.json();
      setPartidos(dataP);

      // 4. Feed de pronósticos
      const resF = await fetch(`/api/pronosticos/quiniela/${codigo}`);
      const dataF = await resF.json();
      setFeed(dataF);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen pt-20 flex items-center justify-center text-white">Cargando...</div>;
  if (error) return <div className="min-h-screen pt-20 flex items-center justify-center text-red-500">{error}</div>;
  if (!quiniela) return null;

  const miRegistro = miembros.find(m => m.usuario_id === usuarioLocal.id);
  const isAdmin = miRegistro?.rol === 'admin';

  return (
    <div className="min-h-screen pt-20 bg-gray-100 pb-10">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Header de la Quiniela */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-3xl font-bold text-[#1c803c]">{quiniela.nombre}</h1>
              <p className="text-gray-500 mt-1">Código de Acceso: <span className="font-mono bg-gray-200 px-2 py-1 rounded text-black">{quiniela.codigo_acceso}</span></p>
            </div>
            <div className="mt-4 md:mt-0 text-right">
              <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 rounded-full uppercase font-semibold tracking-wide">
                {miRegistro ? (isAdmin ? 'Administrador' : 'Miembro') : 'Invitado'}
              </span>
              <p className="text-sm text-gray-500 mt-2">{miembros.length} Participantes</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto bg-white rounded-lg shadow-sm mb-6">
          {['pronosticos', 'posiciones', 'feed', 'reglas'].concat(isAdmin ? ['admin'] : []).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 px-6 text-sm font-medium capitalize transition-colors ${
                activeTab === tab 
                  ? 'border-b-2 border-[#1c803c] text-[#1c803c]' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab === 'admin' ? 'Administración' : tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {activeTab === 'pronosticos' && <TabPronosticos partidos={partidos} miRegistro={miRegistro} recargar={cargarDatos} />}
          {activeTab === 'posiciones' && <TabPosiciones miembros={miembros} />}
          {activeTab === 'feed' && <TabFeed feed={feed} miRegistro={miRegistro} recargar={cargarDatos} />}
          {activeTab === 'reglas' && <TabReglas reglas={quiniela.reglas} />}
          {activeTab === 'admin' && isAdmin && <TabAdmin quiniela={quiniela} miembros={miembros} reload={cargarDatos} />}
        </div>

      </div>
    </div>
  );
};

// --- Subcomponentes para cada Tab ---

const ModalAñadirPronostico = ({ partidos, miRegistro, onClose, onGuardado, misPronosticosActuales }) => {
  const [predicciones, setPredicciones] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ text: '', type: '' });
  const [manualInput, setManualInput] = useState('');

  useEffect(() => {
    const loadedPreds = {};
    if (Array.isArray(misPronosticosActuales)) {
      misPronosticosActuales.forEach(p => {
        loadedPreds[p.partido_id] = { local: p.goles_local, visitante: p.goles_visitante };
      });
      setPredicciones(loadedPreds);
    }
  }, [misPronosticosActuales]);

  const handleScoreChange = (partidoId, isLocal, value) => {
    setPredicciones(prev => ({
      ...prev,
      [partidoId]: {
        ...prev[partidoId],
        [isLocal ? 'local' : 'visitante']: value
      }
    }));
  };

  const isLocked = (fechaStr) => {
    const matchDate = new Date(fechaStr).getTime();
    return Date.now() > (matchDate - 600000); // 10 minutos
  };

  const guardarPronostico = async (partidoId, localScore, visitanteScore) => {
    let finalLocal = localScore;
    let finalVisitante = visitanteScore;
    
    if (finalLocal === undefined || finalVisitante === undefined) {
      const pred = predicciones[partidoId];
      if (!pred || pred.local === undefined || pred.visitante === undefined || pred.local === '' || pred.visitante === '') {
        setMensaje({ text: 'Ingresa ambos goles antes de guardar', type: 'error' });
        return;
      }
      finalLocal = pred.local;
      finalVisitante = pred.visitante;
    }
    
    setGuardando(true);
    setMensaje({ text: '', type: '' });
    
    try {
      const res = await fetch('/api/pronosticos/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partido_id: partidoId,
          goles_local: parseInt(finalLocal),
          goles_visitante: parseInt(finalVisitante),
          usuario_quiniela_id: miRegistro.usuario_quiniela_id
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Error al guardar');
      
      setMensaje({ text: `Pronóstico guardado con éxito`, type: 'success' });
      setPredicciones(prev => ({
        ...prev,
        [partidoId]: { local: finalLocal, visitante: finalVisitante }
      }));
      onGuardado();
    } catch (err) {
      setMensaje({ text: err.message, type: 'error' });
    } finally {
      setGuardando(false);
    }
  };

  const guardarPronosticoLibre = async (texto) => {
    setGuardando(true);
    setMensaje({ text: '', type: '' });
    
    try {
      const res = await fetch('/api/pronosticos/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_quiniela_id: miRegistro.usuario_quiniela_id,
          texto_libre: texto
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Error al guardar');
      
      setMensaje({ text: `Pronóstico guardado con éxito`, type: 'success' });
      setManualInput('');
      onGuardado();
    } catch (err) {
      setMensaje({ text: err.message, type: 'error' });
    } finally {
      setGuardando(false);
    }
  };

  const handleManualSubmit = () => {
    if (!manualInput.trim()) return;
    guardarPronosticoLibre(manualInput);
  };

  // Agrupar todos los partidos por fecha para renderizar, ordenándolos primero
  const partidosOrdenados = [...partidos].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  const partidosAgrupados = partidosOrdenados.reduce((acc, p) => {
    const d = new Date(p.fecha).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    if (!acc[d]) acc[d] = [];
    acc[d].push(p);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-5 border-b bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">Próximos Partidos</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 hover:bg-gray-200 p-2 rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
          
          {/* Entrada Manual */}
          <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-bold text-gray-700 mb-2">Entrada Rápida de Texto</h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <input 
                type="text"
                placeholder="Ejemplo: Mexico 1 - 0 South Africa"
                className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-[#1c803c] focus:outline-none"
                value={manualInput}
                onChange={e => setManualInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
              />
              <button 
                onClick={handleManualSubmit}
                disabled={guardando}
                className="bg-[#1c803c] hover:bg-[#14602a] text-white px-4 py-2 rounded-md font-semibold transition-colors disabled:opacity-70 whitespace-nowrap"
              >
                Analizar y Guardar
              </button>
            </div>
          </div>

          {mensaje.text && (
            <div className={`p-3 mb-6 rounded text-sm font-medium ${mensaje.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
              {mensaje.text}
            </div>
          )}
          
          {Object.keys(partidosAgrupados).length > 0 ? (
            <div className="space-y-6">
              {Object.keys(partidosAgrupados).map(fecha => (
                <div key={fecha}>
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 px-1 border-b pb-2">
                    {fecha}
                  </h3>
                  <div className="border border-gray-200 rounded-lg divide-y bg-white shadow-sm">
                    {partidosAgrupados[fecha].map(p => {
                      const locked = isLocked(p.fecha);
                      return (
                        <div key={p.id} className="p-4 flex flex-col items-center gap-3 hover:bg-gray-50 transition-colors">
                          <div className="text-sm text-gray-500 font-medium text-center">
                            {new Date(p.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} hrs
                          </div>
                          
                          <div className="flex items-center justify-center gap-4 w-full">
                            <div className="flex-1 flex justify-end items-center gap-3 min-w-[40px]">
                              <span className="hidden sm:block font-bold text-gray-800 truncate text-right">{p.equipo_local}</span>
                              {getTeamFlagUrl(p.equipo_local) ? (
                                <img src={getTeamFlagUrl(p.equipo_local)} alt={p.equipo_local} className="w-8 h-auto shadow-sm rounded-sm shrink-0" />
                              ) : (
                                <span className="text-2xl shrink-0">🏳️</span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-3 shrink-0">
                              <input 
                                type="number" 
                                min="0"
                                disabled={locked}
                                className={`w-16 h-12 text-center border rounded-lg text-xl font-bold outline-none transition-all ${locked ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed' : 'bg-white focus:ring-2 focus:ring-[#1c803c] border-gray-300'}`}
                                value={predicciones[p.id]?.local ?? ''}
                                onChange={(e) => handleScoreChange(p.id, true, e.target.value)}
                              />
                              <span className="text-gray-400 font-bold">-</span>
                              <input 
                                type="number" 
                                min="0"
                                disabled={locked}
                                className={`w-16 h-12 text-center border rounded-lg text-xl font-bold outline-none transition-all ${locked ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed' : 'bg-white focus:ring-2 focus:ring-[#1c803c] border-gray-300'}`}
                                value={predicciones[p.id]?.visitante ?? ''}
                                onChange={(e) => handleScoreChange(p.id, false, e.target.value)}
                              />
                            </div>

                            <div className="flex-1 flex justify-start items-center gap-3 min-w-[40px]">
                              {getTeamFlagUrl(p.equipo_visitante) ? (
                                <img src={getTeamFlagUrl(p.equipo_visitante)} alt={p.equipo_visitante} className="w-8 h-auto shadow-sm rounded-sm shrink-0" />
                              ) : (
                                <span className="text-2xl shrink-0">🏳️</span>
                              )}
                              <span className="hidden sm:block font-bold text-gray-800 truncate text-left">{p.equipo_visitante}</span>
                            </div>
                          </div>
                          
                          <div className="w-[140px] mt-2">
                            {locked ? (
                              <span className="text-xs font-bold text-red-600 bg-red-50 px-3 py-2 w-full rounded-md border border-red-100 uppercase tracking-wide flex items-center justify-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                                Bloqueado
                              </span>
                            ) : (
                              <button 
                                onClick={() => guardarPronostico(p.id)}
                                disabled={guardando}
                                className="w-full bg-[#1c803c] hover:bg-[#14602a] text-white px-5 py-2 rounded-md text-sm font-semibold transition-colors shadow-sm disabled:opacity-70"
                              >
                                Guardar
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg mb-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-200">
                <svg className="w-8 h-8 text-[#1c803c]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
              </div>
              <p className="text-gray-800 font-bold text-lg mb-1">Modo Quiniela Libre</p>
              <p className="text-gray-500 font-medium text-sm max-w-sm mx-auto">
                No hay partidos programados. Utiliza la <strong className="text-gray-700">Entrada Rápida de Texto</strong> de arriba para enviar tus pronósticos libremente.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TabPronosticos = ({ partidos, miRegistro, recargar }) => {
  const [misPronosticos, setMisPronosticos] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const cargarMisPronosticos = useCallback(() => {
    if (miRegistro) {
      fetch(`/api/pronosticos/usuario/${miRegistro.usuario_quiniela_id}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setMisPronosticos(data);
          }
        })
        .catch(err => console.error("Error al cargar mis pronósticos:", err));
    }
  }, [miRegistro]);

  useEffect(() => {
    cargarMisPronosticos();
  }, [cargarMisPronosticos]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800">Mi Historial de Pronósticos</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 transform hover:-translate-y-0.5"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Añadir Pronóstico
        </button>
      </div>

      {misPronosticos.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {misPronosticos.map(p => (
            <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative">
              <button 
                onClick={async () => {
                  if (!window.confirm("¿Seguro que quieres eliminar este pronóstico?")) return;
                  try {
                    const res = await fetch(`/api/pronosticos/${p.id}`, { method: 'DELETE' });
                    if (res.ok) {
                      cargarMisPronosticos();
                      recargar();
                    } else alert("Error al eliminar");
                  } catch (e) { console.error(e); }
                }}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-full transition-colors"
                title="Eliminar pronóstico"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
              
              <div className="flex justify-between items-center mb-3 pr-8">
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
                    {getTeamFlagUrl(p.equipo_local) ? (
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
                    {getTeamFlagUrl(p.equipo_visitante) ? (
                      <img src={getTeamFlagUrl(p.equipo_visitante)} alt={p.equipo_visitante} className="w-8 h-auto shadow-sm rounded-sm mb-1" />
                    ) : (
                      <span className="text-2xl mb-1">🏳️</span>
                    )}
                    <span className="text-sm font-bold text-gray-700 truncate w-full text-center">{p.equipo_visitante}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
          <h3 className="text-lg font-bold text-gray-700 mb-1">Aún no has hecho ningún pronóstico</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">Empieza a predecir los resultados de los partidos para ganar puntos y escalar en la tabla de posiciones.</p>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="bg-[#1c803c] hover:bg-[#14602a] text-white font-bold py-2.5 px-6 rounded-lg shadow-sm transition-colors"
          >
            Añadir mi primer pronóstico
          </button>
        </div>
      )}

      {isModalOpen && (
        <ModalAñadirPronostico 
           partidos={partidos} 
           miRegistro={miRegistro} 
           onClose={() => setIsModalOpen(false)} 
           onGuardado={() => { cargarMisPronosticos(); recargar(); }} 
           misPronosticosActuales={misPronosticos}
        />
      )}
    </div>
  );
};

const TabPosiciones = ({ miembros }) => {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Tabla de Posiciones</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-[#1c803c] text-white">
            <tr>
              <th className="py-3 px-4 text-left">Posición</th>
              <th className="py-3 px-4 text-left">Nombre</th>
              <th className="py-3 px-4 text-right">Puntos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {miembros.map((m, idx) => (
              <tr key={m.usuario_quiniela_id} className="hover:bg-gray-50">
                <td className="py-3 px-4 font-bold text-gray-500">{idx + 1}</td>
                <td className="py-3 px-4 font-semibold">
                  {m.nombre} {m.rol === 'admin' && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Admin</span>}
                </td>
                <td className="py-3 px-4 text-right font-bold text-[#1c803c]">{m.puntos_totales}</td>
              </tr>
            ))}
            {miembros.length === 0 && (
              <tr>
                <td colSpan="4" className="py-4 text-center text-gray-500">No hay participantes aún.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const TabFeed = ({ feed, miRegistro, recargar }) => {
  const asignarPuntos = async (pronosticoId, puntos) => {
    if (puntos < 0 || puntos > 5) {
      alert("Los puntos deben estar entre 0 y 5");
      return;
    }
    try {
      const res = await fetch(`/api/pronosticos/${pronosticoId}/puntos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puntos: parseInt(puntos) })
      });
      if (res.ok) {
        recargar();
      } else {
        alert("Error al asignar puntos");
      }
    } catch (e) {
      alert("Error de conexión");
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Pronósticos Actuales de la Comunidad</h2>
      <div className="space-y-4">
        {feed.map(f => (
          <div key={f.id} className="p-4 border rounded-lg bg-gray-50 flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div className="flex-1">
              <span className="font-bold text-gray-800">{f.usuario}</span>
              <span className="text-xs text-gray-500 ml-2 block sm:inline">Publicado el {new Date(f.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' })} hrs</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="bg-white px-4 py-2 rounded shadow-sm border text-sm flex gap-4 w-full sm:w-auto">
                <span className="text-gray-600 truncate max-w-[150px] sm:max-w-[200px]">{f.partido}</span>
                <span className="font-bold text-black whitespace-nowrap">{f.pronostico}</span>
              </div>
              
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-bold bg-green-100 text-green-800 px-2 py-1 rounded-full whitespace-nowrap shrink-0">
                  {f.puntos_obtenidos !== null && f.puntos_obtenidos !== undefined ? `${f.puntos_obtenidos} pts` : '0 pts'}
                </span>
                
                {miRegistro?.rol === 'admin' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 bg-white p-1 rounded border shadow-sm">
                      <input 
                        type="number" 
                        min="0" max="5" 
                        className="w-12 text-center border rounded text-sm px-1 py-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0-5"
                        id={`puntos-${f.id}`}
                        defaultValue={f.puntos_obtenidos || 0}
                      />
                      <button 
                        onClick={() => asignarPuntos(f.id, document.getElementById(`puntos-${f.id}`).value)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1.5 rounded font-medium transition-colors"
                      >
                        OK
                      </button>
                    </div>
                    
                    <button 
                      onClick={async () => {
                        if (!window.confirm("¿Seguro que quieres eliminar este pronóstico del feed?")) return;
                        try {
                          const res = await fetch(`/api/pronosticos/${f.id}`, { method: 'DELETE' });
                          if (res.ok) recargar();
                          else alert("Error al eliminar");
                        } catch (e) { console.error(e); }
                      }}
                      className="bg-red-50 hover:bg-red-100 text-red-600 p-1.5 rounded border border-red-200 transition-colors"
                      title="Eliminar pronóstico"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {feed.length === 0 && (
          <p className="text-gray-500 text-center py-8">Nadie ha hecho pronósticos todavía.</p>
        )}
      </div>
    </div>
  );
};

const TabReglas = ({ reglas }) => {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Reglas del Torneo</h2>
      {reglas ? (
        <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-[#1c803c]">
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{reglas}</p>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          El administrador no ha establecido reglas adicionales para esta quiniela.
        </div>
      )}
    </div>
  );
};

const TabAdmin = ({ quiniela, miembros, reload }) => {
  const [nombre, setNombre] = useState(quiniela.nombre);
  const [reglas, setReglas] = useState(quiniela.reglas || '');
  const [mensaje, setMensaje] = useState('');

  const guardarConfig = async () => {
    try {
      const res = await fetch(`/api/quinielas/${quiniela.codigo_acceso}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, reglas })
      });
      if (res.ok) {
        setMensaje('Configuración guardada.');
        reload();
      }
    } catch (e) {
      alert("Error al guardar");
    }
  };

  const expulsar = async (id) => {
    if (!window.confirm("¿Seguro que deseas expulsar a este miembro?")) return;
    try {
      const res = await fetch(`/api/quinielas/${quiniela.codigo_acceso}/miembros/${id}`, { method: 'DELETE' });
      if (res.ok) reload();
      else alert("Error al expulsar");
    } catch (e) {}
  };

  const modificarPuntos = async (id, puntosActuales) => {
    const nuevos = prompt(`Ingresa los nuevos puntos totales:`, puntosActuales);
    if (nuevos === null || isNaN(parseInt(nuevos))) return;
    
    try {
      const res = await fetch(`/api/quinielas/${quiniela.codigo_acceso}/miembros/${id}/puntos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puntos: parseInt(nuevos) })
      });
      if (res.ok) reload();
      else alert("Error al modificar puntos");
    } catch (e) {}
  };

  const sincronizarMundial = async () => {
    if (!window.confirm("¿Deseas descargar y sincronizar todos los partidos del Mundial 2026? Esto actualizará la base de datos.")) return;
    setMensaje('Sincronizando partidos, por favor espera...');
    try {
      const res = await fetch('/api/torneos/sync', { method: 'POST' });
      if (res.ok) {
        setMensaje('Partidos sincronizados correctamente. Recarga la página.');
        reload();
      } else {
        alert("Error al sincronizar");
        setMensaje('');
      }
    } catch (e) {
      alert("Error al sincronizar");
      setMensaje('');
    }
  };

  return (
    <div className="space-y-8">
      {/* Edición Básica */}
      <div>
        <h2 className="text-xl font-bold mb-4 border-b pb-2">Configuración</h2>
        {mensaje && <p className="text-blue-600 mb-4 font-semibold p-3 bg-blue-50 rounded-lg">{mensaje}</p>}
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Quiniela</label>
            <input 
              className="w-full border rounded p-2" 
              value={nombre} 
              onChange={e => setNombre(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reglas (Opcional)</label>
            <textarea 
              className="w-full border rounded p-2 h-24" 
              value={reglas} 
              onChange={e => setReglas(e.target.value)} 
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <button onClick={guardarConfig} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold transition-colors">Guardar Cambios</button>
            {quiniela.torneo_id !== 'LIBRE' && (
              <button onClick={sincronizarMundial} className="bg-[#1c803c] hover:bg-[#14602a] text-white px-4 py-2 rounded font-semibold transition-colors">
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                  Sincronizar Partidos
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Gestión de Participantes */}
      <div>
        <h2 className="text-xl font-bold mb-4 border-b pb-2">Gestión de Participantes</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 text-left">Nombre</th>
                <th className="py-2 px-4 text-left">Rol</th>
                <th className="py-2 px-4 text-left">Puntos</th>
                <th className="py-2 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {miembros.map(m => (
                <tr key={m.usuario_quiniela_id}>
                  <td className="py-2 px-4">{m.nombre}</td>
                  <td className="py-2 px-4">{m.rol}</td>
                  <td className="py-2 px-4">{m.puntos_totales}</td>
                  <td className="py-2 px-4 text-right space-x-2">
                    <button 
                      onClick={() => modificarPuntos(m.usuario_quiniela_id, m.puntos_totales)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Puntos
                    </button>
                    {m.rol !== 'admin' && (
                      <button 
                        onClick={() => expulsar(m.usuario_quiniela_id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Expulsar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default QuinielaDetallePage;
