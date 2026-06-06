import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUsuarioLogueado } from '../utils/auth';

const InvitePage = () => {
  const { codigo } = useParams();
  const navigate = useNavigate();
  const [mensaje, setMensaje] = useState('Procesando invitación...');

  useEffect(() => {
    const procesarInvitacion = async () => {
      const usuario = getUsuarioLogueado();

      if (!usuario) {
        // No está logueado, guardamos el código y lo mandamos a registrarse
        localStorage.setItem('inviteCode', codigo);
        navigate('/ingresar');
        return;
      }

      // Si está logueado, lo intentamos unir a la quiniela
      try {
        const res = await fetch('/api/quinielas/unirse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuario_id: usuario.id, quiniela_codigo: codigo })
        });
        
        if (res.ok) {
          // Unido exitosamente o ya era miembro
          setMensaje('¡Te has unido exitosamente! Redirigiendo...');
          setTimeout(() => {
            navigate(`/quiniela/${codigo}`);
          }, 1000);
        } else {
          const data = await res.json();
          setMensaje(data.detail || 'Error al unirse a la quiniela');
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        }
      } catch (error) {
        setMensaje('Error de conexión');
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    };

    procesarInvitacion();
  }, [codigo, navigate]);

  return (
    <div className="min-h-screen pt-20 flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md text-center max-w-md w-full border border-gray-100">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Invitación a Quiniela</h2>
        <p className="text-gray-600 font-medium">{mensaje}</p>
      </div>
    </div>
  );
};

export default InvitePage;
