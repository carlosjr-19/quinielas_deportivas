import React, { useEffect, useState } from 'react';
import { getTeamFlagUrl } from '../utils/helpers';

const MatchPredictionList = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/partidos/proximos')
      .then((res) => {
        if (!res.ok) throw new Error('Error fetching matches');
        return res.json();
      })
      .then((data) => {
        setMatches(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-center p-10 text-gray-500">Cargando próximos partidos...</div>;

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h2 className="text-2xl font-bold text-center mb-8 text-blue-900">Próximos Partidos</h2>
      
      {matches.length === 0 ? (
        <p className="text-center text-gray-500">No hay partidos próximos disponibles.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {matches.slice(0, 4).map((match) => {
            const dateObj = new Date(match.fecha);
            const formattedDate = dateObj.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
            const formattedTime = dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

            return (
              <div key={match.id} className="bg-white rounded-xl shadow-sm hover:shadow-md overflow-hidden border border-gray-100 p-4 transition-transform hover:scale-105">
                <div className="text-center mb-3 pb-2 border-b border-gray-50">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{formattedDate}</p>
                  <p className="text-lg font-bold text-gray-800">{formattedTime} hrs</p>
                </div>
                
                <div className="flex items-center justify-between mb-2">
                  {/* Local */}
                  <div className="flex flex-col items-center w-2/5">
                    {getTeamFlagUrl(match.equipo_local) ? (
                      <img src={getTeamFlagUrl(match.equipo_local)} alt={match.equipo_local} className="w-8 h-auto shadow-sm rounded-sm mb-2" />
                    ) : (
                      <span className="text-xl mb-1">🏳️</span>
                    )}
                    <span className="font-bold text-sm text-gray-700 text-center truncate w-full">{match.equipo_local}</span>
                  </div>
                  
                  <div className="text-gray-300 font-bold text-xs">VS</div>
                  
                  {/* Visitante */}
                  <div className="flex flex-col items-center w-2/5">
                    {getTeamFlagUrl(match.equipo_visitante) ? (
                      <img src={getTeamFlagUrl(match.equipo_visitante)} alt={match.equipo_visitante} className="w-8 h-auto shadow-sm rounded-sm mb-2" />
                    ) : (
                      <span className="text-xl mb-1">🏳️</span>
                    )}
                    <span className="font-bold text-sm text-gray-700 text-center truncate w-full">{match.equipo_visitante}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MatchPredictionList;
