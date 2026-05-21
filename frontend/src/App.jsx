import React from 'react';
import MatchPredictionList from './components/MatchPredictionList';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
          Mi Quiniela
        </h1>
        <p className="text-gray-500 mt-2">¡Pon a prueba tus conocimientos deportivos!</p>
      </header>

      <main>
        <MatchPredictionList />
      </main>

      <div className="mb-10 text-center">
        <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
          PROXIMAMENTE ...
        </h2>
      </div>
    </div>
  );
}

export default App;
