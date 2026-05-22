import React, { useState, useEffect } from 'react';
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
          {activeTab === 'pronosticos' && <TabPronosticos partidos={partidos} miRegistro={miRegistro} />}
          {activeTab === 'posiciones' && <TabPosiciones miembros={miembros} />}
          {activeTab === 'feed' && <TabFeed feed={feed} />}
          {activeTab === 'reglas' && <TabReglas reglas={quiniela.reglas} />}
          {activeTab === 'admin' && isAdmin && <TabAdmin quiniela={quiniela} miembros={miembros} reload={cargarDatos} />}
        </div>

      </div>
    </div>
  );
};

// --- Subcomponentes para cada Tab ---

const TabPronosticos = ({ partidos, miRegistro }) => {
  const [predicciones, setPredicciones] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ text: '', type: '' });

  const handleScoreChange = (partidoId, isLocal, value) => {
    setPredicciones(prev => ({
      ...prev,
      [partidoId]: {
        ...prev[partidoId],
        [isLocal ? 'local' : 'visitante']: value
      }
    }));
  };

  const guardarPronostico = async (partidoId) => {
    const pred = predicciones[partidoId];
    if (!pred || pred.local === undefined || pred.visitante === undefined || pred.local === '' || pred.visitante === '') {
      setMensaje({ text: 'Ingresa ambos goles antes de guardar', type: 'error' });
      return;
    }
    
    setGuardando(true);
    setMensaje({ text: '', type: '' });
    
    try {
      const res = await fetch('/api/pronosticos/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partido_id: partidoId,
          goles_local: parseInt(pred.local),
          goles_visitante: parseInt(pred.visitante),
          usuario_quiniela_id: miRegistro.usuario_quiniela_id
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Error al guardar');
      setMensaje({ text: 'Pronóstico guardado con éxito', type: 'success' });
    } catch (err) {
      setMensaje({ text: err.message, type: 'error' });
    } finally {
      setGuardando(false);
    }
  };

  // Agrupar por fecha
  const porFecha = partidos.reduce((acc, p) => {
    const d = new Date(p.fecha).toLocaleDateString();
    if (!acc[d]) acc[d] = [];
    acc[d].push(p);
    return acc;
  }, {});

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Ingresa tus Pronósticos</h2>
      {mensaje.text && (
        <div className={`p-3 mb-4 rounded text-sm ${mensaje.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {mensaje.text}
        </div>
      )}
      
      {Object.entries(porFecha).map(([fecha, lista]) => (
        <div key={fecha} className="mb-8">
          <h3 className="text-lg font-semibold bg-gray-200 px-4 py-2 rounded-t-md">{fecha}</h3>
          <div className="border border-gray-200 rounded-b-md divide-y">
            {lista.map(p => (
              <div key={p.id} className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex-1 text-center md:text-left text-sm text-gray-500">
                  {new Date(p.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {p.estado}
                </div>
                
                <div className="flex-2 flex items-center justify-center gap-4 w-full md:w-auto">
                  <div className="text-right font-semibold flex-1 truncate flex items-center justify-end gap-2">
                    {p.equipo_local}
                    {getTeamFlagUrl(p.equipo_local) ? (
                      <img src={getTeamFlagUrl(p.equipo_local)} alt={p.equipo_local} className="w-6 h-auto shadow-sm rounded-sm" />
                    ) : (
                      <span className="text-lg">🏳️</span>
                    )}
                  </div>
                  <input 
                    type="number" 
                    min="0"
                    className="w-16 h-10 text-center border rounded-md text-lg focus:ring-2 focus:ring-[#1c803c] outline-none"
                    value={predicciones[p.id]?.local ?? ''}
                    onChange={(e) => handleScoreChange(p.id, true, e.target.value)}
                  />
                  <span className="text-gray-400 font-bold">-</span>
                  <input 
                    type="number" 
                    min="0"
                    className="w-16 h-10 text-center border rounded-md text-lg focus:ring-2 focus:ring-[#1c803c] outline-none"
                    value={predicciones[p.id]?.visitante ?? ''}
                    onChange={(e) => handleScoreChange(p.id, false, e.target.value)}
                  />
                  <div className="text-left font-semibold flex-1 truncate flex items-center gap-2">
                    {getTeamFlagUrl(p.equipo_visitante) ? (
                      <img src={getTeamFlagUrl(p.equipo_visitante)} alt={p.equipo_visitante} className="w-6 h-auto shadow-sm rounded-sm" />
                    ) : (
                      <span className="text-lg">🏳️</span>
                    )}
                    {p.equipo_visitante}
                  </div>
                </div>
                
                <div className="flex-1 text-center md:text-right">
                  <button 
                    onClick={() => guardarPronostico(p.id)}
                    disabled={guardando}
                    className="bg-[#1c803c] hover:bg-[#14602a] text-white px-4 py-2 rounded-md text-sm transition-colors w-full md:w-auto"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
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

const TabFeed = ({ feed }) => {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Pronósticos Actuales de la Comunidad</h2>
      <div className="space-y-4">
        {feed.map(f => (
          <div key={f.id} className="p-4 border rounded-lg bg-gray-50 flex flex-col md:flex-row justify-between md:items-center gap-2">
            <div>
              <span className="font-bold text-gray-800">{f.usuario}</span>
              <span className="text-xs text-gray-400 ml-2">{new Date(f.fecha).toLocaleString()}</span>
            </div>
            <div className="bg-white px-4 py-2 rounded shadow-sm border text-sm flex gap-4">
              <span className="text-gray-600">{f.partido}</span>
              <span className="font-bold text-black">{f.pronostico}</span>
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

  return (
    <div className="space-y-8">
      {/* Edición Básica */}
      <div>
        <h2 className="text-xl font-bold mb-4 border-b pb-2">Configuración</h2>
        {mensaje && <p className="text-green-600 mb-2">{mensaje}</p>}
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
          <button onClick={guardarConfig} className="bg-blue-600 text-white px-4 py-2 rounded">Guardar Cambios</button>
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
