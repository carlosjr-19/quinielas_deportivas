import React, { useState, useEffect } from 'react';

const flagMap = {
  'Algeria': 'dz', 'Argentina': 'ar', 'Australia': 'au', 'Austria': 'at',
  'Belgium': 'be', 'Bosnia & Herzegovina': 'ba', 'Brazil': 'br', 'Canada': 'ca',
  'Cape Verde': 'cv', 'Colombia': 'co', 'Croatia': 'hr', 'Curaçao': 'cw',
  'Czech Republic': 'cz', 'DR Congo': 'cd', 'Ecuador': 'ec', 'Egypt': 'eg',
  'England': 'gb-eng', 'France': 'fr', 'Germany': 'de', 'Ghana': 'gh',
  'Haiti': 'ht', 'Iran': 'ir', 'Iraq': 'iq', 'Ivory Coast': 'ci',
  'Japan': 'jp', 'Jordan': 'jo', 'Mexico': 'mx', 'Morocco': 'ma',
  'Netherlands': 'nl', 'New Zealand': 'nz', 'Norway': 'no', 'Panama': 'pa',
  'Paraguay': 'py', 'Portugal': 'pt', 'Qatar': 'qa', 'Saudi Arabia': 'sa',
  'Scotland': 'gb-sct', 'Senegal': 'sn', 'South Africa': 'za', 'South Korea': 'kr',
  'Spain': 'es', 'Sweden': 'se', 'Switzerland': 'ch', 'Tunisia': 'tn',
  'Turkey': 'tr', 'USA': 'us', 'Uruguay': 'uy', 'Uzbekistan': 'uz'
};

const getFlagUrl = (teamName) => {
  const code = flagMap[teamName];
  return code ? `https://flagcdn.com/w40/${code}.png` : null;
};

const MundialPage = () => {
  const [data, setData] = useState({ grupos: [], ultimos_resultados: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEstadisticas = async () => {
      try {
        const response = await fetch('/api/torneos/WC-2026/estadisticas');
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Error fetching statistics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEstadisticas();
  }, []);

  if (loading) {
    return <div className="min-h-[100svh] flex justify-center items-center text-xl text-gray-500 bg-gray-50">Cargando resultados del mundial...</div>;
  }

  return (
    <div className="min-h-[100svh] bg-gray-50 pt-24 md:pt-32 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-8 md:mb-12 text-center">
          Mundial 2026
        </h1>

        {/* Últimos Resultados */}
        {data.ultimos_resultados.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="text-blue-600">⚡</span> Últimos Resultados
            </h2>
            <div className="flex overflow-x-auto pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 gap-4 snap-x">
              {data.ultimos_resultados.map((resultado, index) => {
                const flagLocal = getFlagUrl(resultado.equipo_local);
                const flagVisitante = getFlagUrl(resultado.equipo_visitante);
                
                return (
                  <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 min-w-[300px] flex-shrink-0 snap-center hover:shadow-md transition-shadow">
                    <div className="text-xs text-gray-500 mb-3 text-center uppercase tracking-wide font-semibold">{resultado.ronda}</div>
                    <div className="flex justify-between items-center w-full font-bold text-gray-800">
                      
                      {/* Equipo Local */}
                      <div className="flex flex-col items-center w-1/3 gap-2">
                        {flagLocal ? (
                          <img src={flagLocal} alt={resultado.equipo_local} className="w-10 h-10 object-cover rounded-full shadow-sm border border-gray-100" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">?</div>
                        )}
                        <span className="truncate w-full text-center text-sm">{resultado.equipo_local}</span>
                      </div>

                      {/* Marcador */}
                      <div className="flex flex-col items-center justify-center w-1/3">
                        <div className="bg-gray-900 text-white rounded-lg px-3 py-1.5 text-lg shadow-inner">
                          {resultado.goles_local} - {resultado.goles_visitante}
                        </div>
                      </div>

                      {/* Equipo Visitante */}
                      <div className="flex flex-col items-center w-1/3 gap-2">
                        {flagVisitante ? (
                          <img src={flagVisitante} alt={resultado.equipo_visitante} className="w-10 h-10 object-cover rounded-full shadow-sm border border-gray-100" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">?</div>
                        )}
                        <span className="truncate w-full text-center text-sm">{resultado.equipo_visitante}</span>
                      </div>
                      
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tablas de Grupos */}
        {data.grupos.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="text-green-600">🏆</span> Fase de Grupos
            </h2>
            
            {/* Contenedor con scroll horizontal */}
            <div className="flex overflow-x-auto pb-8 -mx-4 px-4 sm:mx-0 sm:px-0 gap-6 snap-x">
              {data.grupos.map((grupo, gIndex) => (
                <div key={gIndex} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-w-[320px] max-w-[350px] flex-shrink-0 snap-start">
                  <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-3 px-4 font-bold text-center tracking-wider">
                    {grupo.nombre}
                  </div>
                  <div>
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] sm:text-xs">
                        <tr>
                          <th className="px-3 py-3">Equipo</th>
                          <th className="px-1 py-3 text-center" title="Partidos Jugados">PJ</th>
                          <th className="px-1 py-3 text-center" title="Diferencia de Goles">DG</th>
                          <th className="px-3 py-3 text-center font-bold text-gray-800" title="Puntos">Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {grupo.equipos.map((equipo, eIndex) => {
                          const flag = getFlagUrl(equipo.equipo);
                          return (
                            <tr key={eIndex} className="border-b last:border-b-0 hover:bg-blue-50 transition-colors">
                              <td className="px-3 py-3 font-medium text-gray-800 flex items-center gap-2">
                                <span className={`w-4 text-center font-bold ${eIndex < 2 ? 'text-blue-600' : 'text-gray-400'}`}>{eIndex + 1}</span>
                                {flag ? (
                                  <img src={flag} alt={equipo.equipo} className="w-6 h-4 object-cover rounded-sm shadow-sm" />
                                ) : (
                                  <span className="w-6 h-4 bg-gray-200 rounded-sm inline-block"></span>
                                )}
                                <span className="truncate max-w-[120px]" title={equipo.equipo}>{equipo.equipo}</span>
                              </td>
                              <td className="px-1 py-3 text-center text-gray-500">{equipo.PJ}</td>
                              <td className="px-1 py-3 text-center text-gray-500">{equipo.DG > 0 ? `+${equipo.DG}` : equipo.DG}</td>
                              <td className="px-3 py-3 text-center font-bold text-blue-700 text-base">{equipo.Pts}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Fases Eliminatorias (Cuadro de Desarrollo Bracket) */}
        {data.eliminatorias && Object.keys(data.eliminatorias).length > 0 && (
          <div className="mt-16 bg-white p-4 sm:p-8 rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
            <h2 className="text-2xl font-bold text-gray-800 mb-8 flex items-center gap-2 border-b border-gray-100 pb-4">
              <span className="text-blue-600">🏆</span> Cuadro de desarrollo
            </h2>
            
            <div className="flex overflow-x-auto pb-12 w-full custom-scrollbar">
              <div className="flex gap-8 min-w-max mx-auto relative px-4">
                
                {[
                  { key: 'Round of 32', title: 'Dieciseisavos de final' },
                  { key: 'Round of 16', title: 'Octavos de final' },
                  { key: 'Quarter-final', title: 'Cuartos de final' },
                  { key: 'Semi-final', title: 'Semifinales' },
                  { key: 'Final', title: 'Final' }
                ].map((round, rIndex, arr) => {
                  const matches = data.eliminatorias[round.key];
                  if (!matches || matches.length === 0) return null;
                  
                  return (
                    <div key={round.key} className="flex flex-col w-[260px] flex-shrink-0 relative">
                      {/* Round Header */}
                      <div className="bg-gray-100 text-blue-800 py-2 px-4 text-center border border-gray-200 text-sm mb-6 sticky top-0 z-10">
                        {round.title}
                      </div>
                      
                      {/* Matches Container */}
                      <div className="flex flex-col justify-around flex-grow relative">
                        {matches.map((match, mIndex) => {
                          const flagLocal = getFlagUrl(match.equipo_local);
                          const flagVisitante = getFlagUrl(match.equipo_visitante);
                          const isLocalTBD = match.equipo_local.length <= 2 || match.equipo_local.includes('/');
                          const isVisitanteTBD = match.equipo_visitante.length <= 2 || match.equipo_visitante.includes('/');

                          return (
                            <div key={mIndex} className="relative w-full my-2">
                              {/* Connecting Lines to Next Round */}
                              {rIndex < arr.length - 1 && (
                                <>
                                  <div className="absolute -right-4 w-4 border-t-2 border-gray-300 top-1/2"></div>
                                  {mIndex % 2 === 0 ? (
                                    <div className="absolute -right-4 w-0 border-r-2 border-gray-300 h-[calc(50%+1rem)] top-1/2"></div>
                                  ) : (
                                    <div className="absolute -right-4 w-0 border-r-2 border-gray-300 h-[calc(50%+1rem)] bottom-1/2"></div>
                                  )}
                                </>
                              )}
                              
                              <div className="text-[11px] text-gray-600 mb-1 ml-1 font-medium">
                                {match.fecha} <span className="text-blue-600 mx-1">—</span> {match.hora || ''}
                              </div>
                              <div className="bg-white border border-gray-300 rounded-[2px] overflow-hidden text-sm flex flex-col relative z-10">
                                
                                {/* Equipo 1 */}
                                <div className="flex items-center justify-between p-1.5 border-b border-gray-200">
                                  <div className="flex items-center gap-2 overflow-hidden px-1">
                                    {flagLocal && !isLocalTBD ? (
                                      <img src={flagLocal} alt={match.equipo_local} className="w-5 h-3.5 object-cover rounded-sm shadow-sm opacity-90 border border-gray-100" />
                                    ) : (
                                      <span className="w-5 h-3.5 bg-gray-200 rounded-sm inline-block flex-shrink-0 text-[8px] text-center text-gray-400 font-bold leading-3">?</span>
                                    )}
                                    <span className={`truncate ${isLocalTBD ? 'text-gray-500' : 'text-gray-800'}`}>
                                      {match.equipo_local}
                                    </span>
                                  </div>
                                  <span className="text-gray-900 font-semibold bg-gray-50 px-2 min-w-[24px] text-center border-l border-gray-200 h-full flex items-center justify-center">
                                    {match.goles_local !== null ? match.goles_local : ''}
                                  </span>
                                </div>
                                
                                {/* Equipo 2 */}
                                <div className="flex items-center justify-between p-1.5">
                                  <div className="flex items-center gap-2 overflow-hidden px-1">
                                    {flagVisitante && !isVisitanteTBD ? (
                                      <img src={flagVisitante} alt={match.equipo_visitante} className="w-5 h-3.5 object-cover rounded-sm shadow-sm opacity-90 border border-gray-100" />
                                    ) : (
                                      <span className="w-5 h-3.5 bg-gray-200 rounded-sm inline-block flex-shrink-0 text-[8px] text-center text-gray-400 font-bold leading-3">?</span>
                                    )}
                                    <span className={`truncate ${isVisitanteTBD ? 'text-gray-500' : 'text-gray-800'}`}>
                                      {match.equipo_visitante}
                                    </span>
                                  </div>
                                  <span className="text-gray-900 font-semibold bg-gray-50 px-2 min-w-[24px] text-center border-l border-gray-200 h-full flex items-center justify-center">
                                    {match.goles_visitante !== null ? match.goles_visitante : ''}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Partido por el tercer puesto */}
            {data.eliminatorias['Match for third place'] && data.eliminatorias['Match for third place'].length > 0 && (
              <div className="mt-8 flex justify-end border-t border-gray-100 pt-6">
                <div className="w-[260px] relative z-10">
                  <div className="text-xs text-center text-blue-600 mb-2">Partido por el tercer puesto</div>
                  {data.eliminatorias['Match for third place'].map((match, mIndex) => {
                    const flagLocal = getFlagUrl(match.equipo_local);
                    const flagVisitante = getFlagUrl(match.equipo_visitante);
                    const isLocalTBD = match.equipo_local.length <= 2 || match.equipo_local.includes('/');
                    const isVisitanteTBD = match.equipo_visitante.length <= 2 || match.equipo_visitante.includes('/');

                    return (
                      <div key={mIndex} className="bg-white border border-gray-300 rounded-[2px] overflow-hidden text-sm flex flex-col shadow-sm">
                        <div className="text-[11px] text-gray-600 mb-1 ml-2 mt-1 font-medium">
                          {match.fecha}
                        </div>
                        <div className="flex items-center justify-between p-1.5 border-b border-gray-200">
                          <div className="flex items-center gap-2 overflow-hidden px-1">
                            {flagLocal && !isLocalTBD ? (
                                <img src={flagLocal} alt={match.equipo_local} className="w-5 h-3.5 object-cover rounded-sm shadow-sm opacity-90 border border-gray-100" />
                            ) : (
                                <span className="w-5 h-3.5 bg-gray-200 rounded-sm inline-block flex-shrink-0 text-[8px] text-center text-gray-400 font-bold leading-3">?</span>
                            )}
                            <span className={`truncate ${isLocalTBD ? 'text-gray-500' : 'text-gray-800'}`}>
                                {match.equipo_local}
                            </span>
                          </div>
                          <span className="text-gray-900 font-semibold bg-gray-50 px-2 min-w-[24px] text-center border-l border-gray-200 h-full flex items-center justify-center">
                            {match.goles_local !== null ? match.goles_local : ''}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-1.5">
                          <div className="flex items-center gap-2 overflow-hidden px-1">
                            {flagVisitante && !isVisitanteTBD ? (
                                <img src={flagVisitante} alt={match.equipo_visitante} className="w-5 h-3.5 object-cover rounded-sm shadow-sm opacity-90 border border-gray-100" />
                            ) : (
                                <span className="w-5 h-3.5 bg-gray-200 rounded-sm inline-block flex-shrink-0 text-[8px] text-center text-gray-400 font-bold leading-3">?</span>
                            )}
                            <span className={`truncate ${isVisitanteTBD ? 'text-gray-500' : 'text-gray-800'}`}>
                                {match.equipo_visitante}
                            </span>
                          </div>
                          <span className="text-gray-900 font-semibold bg-gray-50 px-2 min-w-[24px] text-center border-l border-gray-200 h-full flex items-center justify-center">
                            {match.goles_visitante !== null ? match.goles_visitante : ''}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MundialPage;
