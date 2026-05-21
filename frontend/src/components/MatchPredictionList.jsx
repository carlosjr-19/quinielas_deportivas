import React, { useEffect, useState } from 'react';

const MatchPredictionList = () => {
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Al estar montado en el mismo puerto por FastAPI, podemos usar rutas relativas
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

  const handlePredictionChange = (matchId, team, value) => {
    setPredictions((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [team]: value,
      },
    }));
  };

  const handleSavePrediction = (matchId) => {
    const matchPrediction = predictions[matchId];
    if (!matchPrediction || matchPrediction.local === undefined || matchPrediction.visitante === undefined) {
      alert('Ingresa ambos goles antes de guardar.');
      return;
    }
    
    console.log('Enviando pronóstico para el partido', matchId, ':', matchPrediction);
    // Aquí iría el POST a /api/pronosticos/
  };

  if (loading) return <div className="text-center p-10 text-gray-500">Cargando próximos partidos...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold text-center mb-8 text-blue-900">Próximos Partidos</h2>
      
      {matches.length === 0 ? (
        <p className="text-center text-gray-500">No hay partidos próximos disponibles.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {matches.map((match) => {
            const dateObj = new Date(match.fecha);
            const formattedDate = dateObj.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
            const formattedTime = dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

            return (
              <div key={match.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 p-5 transition-transform hover:scale-105">
                <div className="text-center mb-4 pb-2 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{formattedDate}</p>
                  <p className="text-xl font-bold text-gray-800">{formattedTime} hrs</p>
                </div>
                
                <div className="flex items-center justify-between mb-6">
                  {/* Local */}
                  <div className="flex flex-col items-center w-1/3">
                    <span className="font-bold text-lg text-gray-700 text-center">{match.equipo_local}</span>
                    <input 
                      type="number" 
                      min="0"
                      className="mt-2 w-16 h-12 text-center text-xl font-bold border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                      placeholder="0"
                      value={predictions[match.id]?.local ?? ''}
                      onChange={(e) => handlePredictionChange(match.id, 'local', e.target.value)}
                    />
                  </div>
                  
                  <div className="text-gray-400 font-bold">VS</div>
                  
                  {/* Visitante */}
                  <div className="flex flex-col items-center w-1/3">
                    <span className="font-bold text-lg text-gray-700 text-center">{match.equipo_visitante}</span>
                    <input 
                      type="number" 
                      min="0"
                      className="mt-2 w-16 h-12 text-center text-xl font-bold border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                      placeholder="0"
                      value={predictions[match.id]?.visitante ?? ''}
                      onChange={(e) => handlePredictionChange(match.id, 'visitante', e.target.value)}
                    />
                  </div>
                </div>
                
                <button 
                  onClick={() => handleSavePrediction(match.id)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                >
                  Guardar Pronóstico
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MatchPredictionList;
