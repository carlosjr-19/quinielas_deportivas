// Funciones simples para manejar la autenticación en localStorage

export const loginUsuario = (userData) => {
  localStorage.setItem('usuario', JSON.stringify(userData));
};

export const logoutUsuario = () => {
  localStorage.removeItem('usuario');
};

export const getUsuarioLogueado = () => {
  const user = localStorage.getItem('usuario');
  return user ? JSON.parse(user) : null;
};

export const isAutenticado = () => {
  return localStorage.getItem('usuario') !== null;
};
