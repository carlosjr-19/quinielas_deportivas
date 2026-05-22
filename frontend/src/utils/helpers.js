import teamsInfo from './teamsInfo.json';

export const getTeamFlagUrl = (teamName) => {
  if (!teamName) return '';
  // Buscar por nombre exacto o normalizado
  const team = teamsInfo.find(
    (t) => t.name.toLowerCase() === teamName.toLowerCase() || 
           (t.name_normalised && t.name_normalised.toLowerCase() === teamName.toLowerCase())
  );
  
  if (!team) return '';

  // Casos especiales (Inglaterra, Escocia, Gales) que usan tags de emoji
  if (team.name === 'England') return 'https://flagcdn.com/w40/gb-eng.png';
  if (team.name === 'Scotland') return 'https://flagcdn.com/w40/gb-sct.png';
  if (team.name === 'Wales') return 'https://flagcdn.com/w40/gb-wls.png';

  // Extraer las dos letras del emoji (Regional Indicator Symbols)
  const codePoints = [...team.flag_icon].map(c => c.codePointAt(0));
  if (codePoints.length === 2 && codePoints[0] >= 127462 && codePoints[1] <= 127487) {
    const isoCode = String.fromCharCode(codePoints[0] - 127397).toLowerCase() + 
                    String.fromCharCode(codePoints[1] - 127397).toLowerCase();
    return `https://flagcdn.com/w40/${isoCode}.png`;
  }

  return '';
};
