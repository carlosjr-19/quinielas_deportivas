import React from 'react';
import MatchPredictionList from '../components/MatchPredictionList';

const HomePage = () => {
  return (
    <>
      {/* Hero Section */}
      <div className="relative min-h-[100svh] flex flex-col pt-20 md:pt-24">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/world_cup_2026_bg.png" 
            alt="Fondo Mundial 2026" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80 md:bg-black/60"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 flex-grow flex items-center justify-center md:justify-start px-6 md:px-10 max-w-6xl mx-auto w-full">
          <div className="text-white max-w-2xl text-center md:text-left">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 md:mb-6 leading-tight drop-shadow-lg">
              Vive el Mundial 2026<br className="hidden sm:block"/> al máximo nivel.
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-200 md:text-gray-300 leading-relaxed mb-8 md:mb-10 drop-shadow">
              Demuestra tus conocimientos deportivos, compite con tus amigos y domina la tabla de posiciones en la plataforma definitiva de pronósticos.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="py-16 bg-gray-50 flex-grow">
        <MatchPredictionList />
      </main>
    </>
  );
};

export default HomePage;
