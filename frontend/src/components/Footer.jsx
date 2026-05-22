import React from 'react';

const Footer = () => {
  const version = import.meta.env.VITE_APP_VERSION || '1.0.0';

  return (
    <footer className="bg-[#111111] text-gray-400 py-8 text-center text-sm font-light border-t border-gray-900 mt-auto">
      <div className="container mx-auto px-4">
        <span className="font-medium text-gray-300">Calciopolis</span> &copy; 2026 - Sole Cybernetic - Version {version}
      </div>
    </footer>
  );
};

export default Footer;
