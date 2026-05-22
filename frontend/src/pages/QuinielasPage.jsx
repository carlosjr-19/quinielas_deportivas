import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsuarioLogueado } from '../utils/auth';

const QuinielasPage = () => {
  const navigate = useNavigate();
  const [quinielas, setQuinielas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const usuario = getUsuarioLogueado();

  useEffect(() => {
    cargarQuinielas();
  }, []);

  const cargarQuinielas = async () => {
    try {
      const url = usuario ? `/api/quinielas/?usuario_id=${usuario.id}` : '/api/quinielas/';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setQuinielas(data);
      }
    } catch (error) {
      console.error("Error al cargar quinielas", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnirse = async (codigo) => {
    if (!usuario) {
      alert("Debes iniciar sesión para unirte a una quiniela.");
      navigate('/ingresar');
      return;
    }

    try {
      const res = await fetch('/api/quinielas/unirse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: usuario.id, quiniela_codigo: codigo })
      });
      if (res.ok) {
        alert("¡Te has unido a la quiniela!");
        navigate(`/quiniela/${codigo}`);
      } else {
        const data = await res.json();
        alert(data.detail || "Error al unirse");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const quinielasFiltradas = quinielas.filter(q => 
    q.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    q.creador_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.codigo_acceso.toLowerCase() === searchTerm.toLowerCase()
  );

  return (
    <div className="min-h-[100svh] bg-gray-50 pt-28 md:pt-32 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 border-b border-gray-200 pb-6 gap-6">
          <div className="w-full md:w-1/2">
            <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">Quinielas Activas</h2>
            <p className="text-gray-500 mt-2">Únete a una liga existente o crea la tuya propia.</p>
            
            <div className="mt-4 relative">
              <input 
                type="text" 
                placeholder="Buscar por torneo, creador o código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
          </div>
          <button 
            onClick={() => navigate(usuario ? '/crear-quiniela' : '/ingresar')}
            className="bg-[#111111] hover:bg-black text-white px-6 py-3 rounded-lg font-semibold shadow-md transition-colors w-full md:w-auto"
          >
            Crear mi Quiniela
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500 font-medium">Cargando quinielas...</div>
        ) : quinielasFiltradas.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300 text-gray-500">
            No se encontraron quinielas con esa búsqueda.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {quinielasFiltradas.map((q) => (
              <div key={q.id} className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-shadow duration-300 border border-gray-200 overflow-hidden group">
                <div className="h-32 bg-gradient-to-br from-blue-900 to-[#111111] relative">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-xl font-bold tracking-wide">{q.nombre}</h3>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex flex-col gap-3 text-gray-600 mb-6">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                      <span className="text-sm font-medium">Creado por: <span className="text-gray-900">{q.creador_nombre}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                      <span className="text-sm font-medium"><span className="text-gray-900 font-bold">{q.participantes}</span> participantes</span>
                    </div>
                  </div>
                  {q.es_miembro ? (
                    <button 
                      onClick={() => navigate(`/quiniela/${q.codigo_acceso}`)}
                      className="w-full py-2.5 bg-[#1c803c] hover:bg-[#14602a] text-white font-semibold rounded-lg shadow-sm transition-colors"
                    >
                      Ya eres miembro, Entrar
                    </button>
                  ) : (
                    <button 
                      onClick={() => {
                        const code = window.prompt("Ingresa el código de acceso de la quiniela para unirte:");
                        if (code) {
                          if (code.toUpperCase() === q.codigo_acceso.toUpperCase()) {
                            handleUnirse(q.codigo_acceso);
                          } else {
                            alert("El código ingresado es incorrecto.");
                          }
                        }
                      }}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-colors"
                    >
                      Unirse a esta Quiniela
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuinielasPage;
