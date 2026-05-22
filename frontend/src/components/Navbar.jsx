import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getUsuarioLogueado, logoutUsuario } from '../utils/auth';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const usuario = getUsuarioLogueado();

  const handleLogout = () => {
    logoutUsuario();
    navigate('/auth');
  };

  return (
    <header className={`absolute top-0 left-0 right-0 z-50 transition-colors duration-300 ${isHome ? 'border-b border-white/10 bg-transparent' : 'border-b border-gray-800 bg-[#111111]'}`}>
      <div className="flex items-center justify-between px-4 md:px-8 py-4 md:py-6 text-white relative z-50">
        {/* Logo & Título */}
        <Link to="/" className="flex items-center gap-3 group">
          <img src="/Logo_quinielas.png" alt="Calciopolis Logo" className="w-10 h-10 md:w-12 md:h-12 object-contain drop-shadow-md group-hover:scale-105 transition-transform" />
          <h1 className="text-xl md:text-2xl font-bold tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-300">
            Calciopolis
          </h1>
        </Link>
        
        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2 text-gray-300 hover:text-white transition-colors"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold tracking-wider uppercase">
          <Link to="/quinielas" className="hover:text-blue-400 transition-colors">Explorar</Link>
          {usuario ? (
            <>
              <Link to="/dashboard" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Dashboard</Link>
              <Link to="/configuracion" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Configuración</Link>
              <button 
                onClick={handleLogout}
                className="ml-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Cerrar Sesión
              </button>
            </>
          ) : (
            <Link to="/ingresar" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-md transition-colors shadow-lg">
              Ingresar
            </Link>
          )}
        </nav>
      </div>

      {/* Mobile Nav Overlay */}
      <div className={`md:hidden fixed inset-0 z-40 bg-[#111111] flex flex-col items-center justify-center transition-transform duration-300 ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <nav className="flex flex-col items-center gap-8 text-lg font-semibold tracking-wider uppercase text-white">
          <Link to="/quinielas" onClick={() => setIsMenuOpen(false)} className="hover:text-blue-400 transition-colors">Explorar Quinielas</Link>
          {usuario ? (
            <>
              <Link to="/dashboard" onClick={() => setIsMenuOpen(false)} className="bg-[#222] border border-gray-700 hover:border-gray-500 text-white px-10 py-3 rounded-md transition-colors shadow-lg flex items-center justify-center gap-2 w-full max-w-xs">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Mi Perfil ({usuario.nombre})
              </Link>
              <Link to="/configuracion" onClick={() => setIsMenuOpen(false)} className="text-gray-300 hover:text-white px-10 py-3 rounded-md transition-colors w-full max-w-xs text-center border border-transparent hover:border-gray-700">
                Configuración
              </Link>
              <button 
                onClick={() => { setIsMenuOpen(false); handleLogout(); }}
                className="bg-red-600 hover:bg-red-700 text-white px-10 py-3 rounded-md transition-colors shadow-lg w-full max-w-xs"
              >
                Cerrar Sesión
              </button>
            </>
          ) : (
            <Link to="/ingresar" onClick={() => setIsMenuOpen(false)} className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 rounded-md transition-colors shadow-lg">
              Ingresar / Registro
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
