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
      const mi_reg = dataM.find(m => m.usuario_id === usuarioLocal.id);
      const resF = await fetch(`/api/feed/quiniela/${codigo}?usuario_quiniela_id=${mi_reg?.usuario_quiniela_id || 0}`);
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
  const isSocio = miRegistro?.rol === 'socio';
  const hasAdminAccess = isAdmin || isSocio;
  // Añadimos comprobación si fue expulsado/abandonó para mostrar mensaje si no existe o no está activo, aunque el dashboard lo oculte, si entra directo por URL.
  // Pero el request dice que el miembro mantiene sus puntos. En esta vista lo seguiremos viendo si no redirigimos.
  
  const salirDeQuiniela = async () => {
    if (!window.confirm("¿Seguro que deseas salir de esta quiniela? Perderás acceso al grupo, pero tus pronósticos quedarán registrados.")) return;
    try {
      const res = await fetch(`/api/quinielas/${codigo}/salir?usuario_id=${usuarioLocal.id}`, { method: 'PUT' });
      if (res.ok) {
        navigate('/dashboard');
      } else {
        const d = await res.json();
        alert(d.detail || "Error al salir");
      }
    } catch(e) {
      alert("Error de conexión");
    }
  };

  const eliminarQuinielaDefinitivamente = async () => {
    if (!window.confirm("🔴 ADVERTENCIA: ¿Estás completamente seguro de ELIMINAR esta quiniela? Todos los pronósticos, miembros y el muro serán borrados permanentemente. Esta acción no se puede deshacer.")) return;
    try {
      const res = await fetch(`/api/quinielas/${codigo}?usuario_id=${usuarioLocal.id}`, { method: 'DELETE' });
      if (res.ok) {
        alert("Quiniela eliminada correctamente.");
        navigate('/dashboard');
      } else {
        const d = await res.json();
        alert(d.detail || "Error al eliminar la quiniela");
      }
    } catch(e) {
      alert("Error de conexión");
    }
  };

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
                {miRegistro ? (isAdmin ? 'Administrador' : isSocio ? 'Socio' : 'Miembro') : 'Invitado'}
              </span>
              <p className="text-sm text-gray-500 mt-2">{miembros.length} Participantes</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
          <div className="flex overflow-x-auto hide-scrollbar space-x-6">
            <button 
              className={`pb-2 whitespace-nowrap ${activeTab === 'pronosticos' ? 'border-b-2 border-[#1c803c] font-bold text-[#1c803c]' : 'text-gray-500'}`}
              onClick={() => setActiveTab('pronosticos')}
            >
              Mis Pronósticos
            </button>
            <button 
              className={`pb-2 whitespace-nowrap ${activeTab === 'posiciones' ? 'border-b-2 border-[#1c803c] font-bold text-[#1c803c]' : 'text-gray-500'}`}
              onClick={() => setActiveTab('posiciones')}
            >
              Posiciones
            </button>
            <button 
              className={`pb-2 whitespace-nowrap ${activeTab === 'feed' ? 'border-b-2 border-[#1c803c] font-bold text-[#1c803c]' : 'text-gray-500'}`}
              onClick={() => setActiveTab('feed')}
            >
              Muro Social
            </button>
            <button 
              className={`pb-2 whitespace-nowrap ${activeTab === 'predicciones' ? 'border-b-2 border-[#1c803c] font-bold text-[#1c803c]' : 'text-gray-500'}`}
              onClick={() => setActiveTab('predicciones')}
            >
              Predicciones
            </button>
            <button 
              className={`pb-2 whitespace-nowrap ${activeTab === 'reglas' ? 'border-b-2 border-[#1c803c] font-bold text-[#1c803c]' : 'text-gray-500'}`}
              onClick={() => setActiveTab('reglas')}
            >
              Reglas
            </button>
            {hasAdminAccess && (
              <button 
                className={`pb-2 whitespace-nowrap ${activeTab === 'admin' ? 'border-b-2 border-purple-600 font-bold text-purple-600' : 'text-gray-500'}`}
                onClick={() => setActiveTab('admin')}
              >
                Administración
              </button>
            )}
          </div>
          {!isAdmin && (
            <button onClick={salirDeQuiniela} className="text-red-500 hover:text-red-700 text-sm font-semibold whitespace-nowrap px-4 border border-red-200 rounded-md py-1">
              Salir de la Quiniela
            </button>
          )}
        </div>

      <div className="max-w-4xl mx-auto pb-12">
        <div className="bg-white rounded-lg shadow-md p-6">
          {activeTab === 'pronosticos' && <TabPronosticos partidos={partidos} miRegistro={miRegistro} recargar={cargarDatos} />}
          {activeTab === 'posiciones' && <TabPosiciones miembros={miembros} quiniela={quiniela} />}
          {activeTab === 'feed' && <TabFeed feed={feed} miRegistro={miRegistro} recargar={cargarDatos} quiniela={quiniela} />}
          {activeTab === 'predicciones' && <TabPredicciones quiniela={quiniela} miRegistro={miRegistro} recargar={cargarDatos} />}
          {activeTab === 'reglas' && <TabReglas reglas={quiniela.reglas} />}
          {activeTab === 'admin' && hasAdminAccess && <TabAdmin quiniela={quiniela} miembros={miembros} reload={cargarDatos} miRegistro={miRegistro} eliminarQuiniela={eliminarQuinielaDefinitivamente} />}
        </div>
      </div>

      </div>
    </div>
  );
};

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
        <div className="flex justify-between items-center p-5 border-b bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">Próximos Partidos</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 hover:bg-gray-200 p-2 rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
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

const TabPosiciones = ({ miembros, quiniela }) => {
  const compartirWhatsApp = () => {
    if (!miembros || miembros.length === 0) return;
    
    let texto = `🏆 Tabla de Posiciones - ${quiniela.nombre} 🏆\n\n`;
    miembros.forEach((m, idx) => {
      let prefijo = idx === 0 ? '👑 ' : `${idx + 1}. `;
      texto += `${prefijo}${m.nombre} - ${m.puntos_totales} pts\n`;
    });
    
    texto += `\nÚnete con el código: ${quiniela.codigo_acceso}`;
    
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Tabla de Posiciones</h2>
        <button 
          onClick={compartirWhatsApp}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-colors flex items-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
          Compartir
        </button>
      </div>
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
                  {idx === 0 && <span className="mr-1" title="Primer lugar">👑</span>}
                  {m.nombre} 
                  {m.rol === 'admin' && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Admin</span>}
                  {m.rol === 'socio' && <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">Socio</span>}
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

const TabFeed = ({ feed, miRegistro, recargar, quiniela }) => {
  const [mensaje, setMensaje] = useState("");
  const [publicando, setPublicando] = useState(false);

  const publicarMensaje = async () => {
    if (!mensaje.trim()) return;
    if (mensaje.length > 100) return alert("El mensaje no puede exceder los 100 caracteres");
    
    setPublicando(true);
    try {
      const res = await fetch('/api/feed/mensaje', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contenido: mensaje,
          quiniela_codigo: quiniela.codigo_acceso,
          usuario_quiniela_id: miRegistro.usuario_quiniela_id
        })
      });
      if (res.ok) {
        setMensaje("");
        recargar();
      }
    } catch (e) {
      alert("Error al publicar mensaje");
    } finally {
      setPublicando(false);
    }
  };

  const toggleReaccion = async (feedItemId, emoji) => {
    try {
      const res = await fetch(`/api/feed/${feedItemId}/reaccionar?usuario_quiniela_id=${miRegistro.usuario_quiniela_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji })
      });
      if (res.ok) recargar();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Muro Social</h2>
      
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col gap-3">
        <textarea 
          maxLength="100"
          rows="2"
          placeholder="¿Qué estás pensando? (Máx 100 caracteres)"
          className="w-full border border-gray-300 rounded-lg p-3 resize-none focus:ring-2 focus:ring-[#1c803c] focus:outline-none text-gray-700"
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
        />
        <div className="flex justify-between items-center">
          <span className={`text-xs font-semibold ${mensaje.length === 100 ? 'text-red-500' : 'text-gray-400'}`}>
            {mensaje.length} / 100
          </span>
          <button 
            onClick={publicarMensaje}
            disabled={publicando || !mensaje.trim()}
            className="bg-[#1c803c] hover:bg-[#14602a] text-white px-5 py-2 rounded-lg font-bold text-sm transition-colors disabled:opacity-50"
          >
            Publicar
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {feed.map(f => (
          <div key={f.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="px-4 py-3 bg-gray-50 flex items-center gap-3 border-b border-gray-100">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-sm">
                {f.usuario ? f.usuario.charAt(0).toUpperCase() : 'S'}
              </div>
              <div>
                <span className="font-bold text-gray-800 block leading-tight">{f.usuario || 'Sistema'}</span>
                <span className="text-xs text-gray-500 font-medium">
                  {new Date(f.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' })}
                </span>
              </div>
            </div>

            <div className="p-4">
              {f.tipo === 'MENSAJE' && (
                <p className="text-gray-800 text-lg leading-relaxed">{f.contenido}</p>
              )}
              
              {f.tipo === 'EVENTO' && (
                <p className="text-gray-600 font-medium italic">ℹ️ {f.contenido}</p>
              )}
              
              {f.tipo === 'PRONOSTICO' && (
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex-1 flex gap-4 items-center">
                    <span className="text-gray-600 font-medium">{f.partido}</span>
                    <span className="font-black text-xl text-black px-4 py-1 bg-white rounded shadow-sm border border-gray-200">{f.pronostico}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="px-4 py-3 bg-white border-t border-gray-100 flex gap-2 overflow-x-auto">
              {f.reacciones?.map(r => (
                <button
                  key={r.emoji}
                  onClick={() => toggleReaccion(f.id, r.emoji)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors border ${r.user_reacted ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                >
                  <span className="text-base">{r.emoji}</span>
                  {r.count > 0 && <span>{r.count}</span>}
                </button>
              ))}
            </div>
          </div>
        ))}
        {feed.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <span className="text-4xl mb-4 block">🦗</span>
            <p className="text-gray-500 font-medium">El muro está vacío. ¡Sé el primero en publicar algo!</p>
          </div>
        )}
      </div>
    </div>
  );
};

const TabReglas = ({ reglas }) => {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Reglas de la Quiniela</h2>
      <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap text-gray-700">
        {reglas || "El administrador no ha especificado reglas adicionales. Se aplican las reglas estándar (3 puntos por acertar marcador exacto, 1 punto por atinar al ganador o empate)."}
      </div>
    </div>
  );
};

const TabPredicciones = ({ quiniela, miRegistro, recargar }) => {
  const [predicciones, setPredicciones] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPredicciones = async () => {
    try {
      const res = await fetch(`/api/pronosticos/quiniela/${quiniela.codigo_acceso}/todas`);
      if (res.ok) {
        const data = await res.json();
        setPredicciones(data);
      }
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredicciones();
  }, [quiniela.codigo_acceso]);

  const asignarPuntos = async (pronosticoId, puntos) => {
    if (!pronosticoId) return;
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
        fetchPredicciones(); // Refrescar vista local
      } else {
        alert("Error al asignar puntos");
      }
    } catch (e) {
      alert("Error de conexión");
    }
  };

  const eliminarPronostico = async (pronosticoId) => {
    if (!pronosticoId) return;
    if (!window.confirm("¿Seguro que quieres eliminar este pronóstico?")) return;
    try {
      const res = await fetch(`/api/pronosticos/${pronosticoId}`, { method: 'DELETE' });
      if (res.ok) {
        recargar();
        fetchPredicciones();
      } else {
        alert("Error al eliminar");
      }
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="text-gray-500 py-8 text-center font-medium">Cargando predicciones...</div>;

  const agrupadas = {};
  predicciones.forEach(p => {
    const d = new Date(p.fecha);
    const dateStr = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
    const timeStr = d.toLocaleTimeString('es-ES', { hour: 'numeric', minute: '2-digit' });
    const key = `${dateStr} ${timeStr} - ${p.usuario}`;
    if (!agrupadas[key]) agrupadas[key] = [];
    agrupadas[key].push(p);
  });

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Todas las Predicciones</h2>
      <div className="space-y-6">
        {Object.keys(agrupadas).map(key => (
          <div key={key} className="bg-white border rounded-xl p-5 shadow-sm">
            <h3 className="font-bold text-gray-800 border-b pb-3 mb-4 flex items-center gap-2">
              <span className="text-xl">📅</span> {key}
            </h3>
            <div className="space-y-3 pl-2">
              {agrupadas[key].map(p => (
                <div key={p.id} className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-gray-50 px-4 py-3 rounded-lg border border-gray-100">
                  <div className="flex gap-4 items-center flex-1">
                    <span className="text-gray-600 font-medium min-w-[120px] md:min-w-[150px]">{p.partido}</span>
                    <span className="font-black text-lg bg-white px-3 py-0.5 rounded shadow-sm border border-gray-200">{p.pronostico}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-bold bg-green-100 text-green-800 px-3 py-1.5 rounded-full whitespace-nowrap shadow-sm border border-green-200">
                      {p.puntos_obtenidos !== null && p.puntos_obtenidos !== undefined ? `${p.puntos_obtenidos} pts` : '0 pts'}
                    </span>
                    
                    {(miRegistro?.rol === 'admin' || miRegistro?.rol === 'socio') && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border shadow-sm">
                          <input 
                            type="number" 
                            min="0" max="5" 
                            className="w-12 text-center border rounded-md text-sm px-1 py-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0-5"
                            id={`puntos-pred-${p.id}`}
                            defaultValue={p.puntos_obtenidos || 0}
                          />
                          <button 
                            onClick={() => asignarPuntos(p.id, document.getElementById(`puntos-pred-${p.id}`).value)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1.5 rounded-md font-bold transition-colors"
                          >
                            OK
                          </button>
                        </div>
                        <button 
                          onClick={() => eliminarPronostico(p.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-lg border border-red-200 transition-colors"
                          title="Eliminar pronóstico"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {Object.keys(agrupadas).length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <span className="text-4xl mb-4 block">⚽</span>
            <p className="text-gray-500 font-medium">No hay predicciones todavía.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const TabAdmin = ({ quiniela, miembros, reload, miRegistro, eliminarQuiniela }) => {
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

  const cambiarRol = async (id, nuevoRol) => {
    if (!window.confirm(`¿Seguro que deseas cambiar el rol a ${nuevoRol}?`)) return;
    try {
      const res = await fetch(`/api/quinielas/${quiniela.codigo_acceso}/miembros/${id}/rol`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rol: nuevoRol })
      });
      if (res.ok) reload();
      else alert("Error al cambiar rol");
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
      {miRegistro?.rol === 'admin' && (
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
      )}

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
                    {miRegistro?.rol === 'admin' && m.rol !== 'admin' && (
                      <button 
                        onClick={() => cambiarRol(m.usuario_quiniela_id, m.rol === 'socio' ? 'usuario' : 'socio')}
                        className="text-purple-600 hover:text-purple-800 text-sm"
                      >
                        {m.rol === 'socio' ? 'Quitar Socio' : 'Hacer Socio'}
                      </button>
                    )}
                    {m.rol !== 'admin' && (miRegistro?.rol === 'admin' || (miRegistro?.rol === 'socio' && m.rol !== 'socio')) && (
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

      {/* Eliminar Quiniela (Solo Admin) */}
      {miRegistro?.rol === 'admin' && (
        <div className="pt-8 border-t border-red-100 mt-8">
          <h2 className="text-xl font-bold mb-4 text-red-600">Zona de Peligro</h2>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800 font-medium mb-4">Al eliminar esta quiniela, todos los datos (miembros, pronósticos, mensajes y puntajes) serán borrados permanentemente. Esta acción es irreversible.</p>
            <button 
              onClick={eliminarQuiniela}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-bold shadow transition-colors"
            >
              Eliminar Quiniela Definitivamente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuinielaDetallePage;
