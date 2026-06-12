import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getUsuarioLogueado, logoutUsuario } from '../utils/auth';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [quinielasCreadas, setQuinielasCreadas] = useState([]);
  const [quinielasUnidas, setQuinielasUnidas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getUsuarioLogueado();
    if (!user) {
      navigate('/ingresar');
      return;
    }
    setUsuario(user);
    cargarDashboard(user.id);
  }, [navigate]);

  const cargarDashboard = async (userId) => {
    try {
      const res = await fetch(`/api/usuarios/${userId}/dashboard`);
      const data = await res.json();
      if (res.ok) {
        setQuinielasCreadas(data.dueño_de);
        setQuinielasUnidas(data.miembro_de);
      }
    } catch (error) {
      console.error("Error al cargar dashboard", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logoutUsuario();
    navigate('/');
  };

  if (loading) return <div className="pt-32 text-center text-xl">Cargando tu perfil...</div>;

  return (
    <div className="min-h-[100svh] bg-gray-50 pt-28 md:pt-32 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Header Dashboard */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-200 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-2xl font-bold">
              {usuario?.nombre?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Hola, {usuario?.nombre}</h2>
              <p className="text-gray-500">Bienvenido a tu panel de control</p>
            </div>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <Link to="/crear-quiniela" className="flex-1 md:flex-none text-center bg-[#111111] hover:bg-black text-white px-6 py-2.5 rounded-lg font-semibold transition-colors">
              Crear Quiniela
            </Link>
            <button onClick={handleLogout} className="flex-1 md:flex-none px-6 py-2.5 text-red-600 hover:bg-red-50 font-semibold rounded-lg border border-red-200 transition-colors">
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Sección: Dueño (Creadas) */}
        <div className="mb-12">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">👑</span>
            Mis Quinielas (Administrador)
          </h3>
          {quinielasCreadas.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500 mb-4">No has creado ninguna quiniela todavía.</p>
              <Link to="/crear-quiniela" className="text-blue-600 font-bold hover:underline">¡Crea tu primera quiniela aquí!</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quinielasCreadas.map(q => (
                <div key={q.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">CÓDIGO: {q.codigo_acceso}</div>
                  <h4 className="text-lg font-bold text-gray-900 mb-4">{q.nombre}</h4>
                  <Link to={`/quiniela/${q.codigo_acceso}`} className="block w-full text-center py-2 bg-gray-50 hover:bg-gray-100 text-gray-800 font-semibold rounded-lg border border-gray-200">
                    Administrar
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sección: Participando */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600">🎮</span>
            Quinielas en las que Participo
          </h3>
          {quinielasUnidas.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500 mb-4">No estás participando en ninguna quiniela de otros usuarios.</p>
              <Link to="/quinielas" className="text-blue-600 font-bold hover:underline">Explorar quinielas públicas</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quinielasUnidas.map(q => (
                <div key={q.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <h4 className="text-lg font-bold text-gray-900 mb-4">{q.nombre}</h4>
                  <Link to={`/quiniela/${q.codigo_acceso}`} className="block w-full text-center py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg border border-blue-200">
                    Hacer Pronósticos
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;
