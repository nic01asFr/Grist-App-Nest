/**
 * App Component - Root Application
 *
 * Responsibilities:
 * - Initialize Grist API
 * - Check and initialize demo data
 * - Render Dashboard when ready
 */

import { useState, useEffect } from 'react';
import GristIntegrationManager from '@core/GristIntegrationManager';
import Dashboard from './components/Dashboard';
import { Loader } from '@templates';

const gristManager = new GristIntegrationManager();

export default function App() {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initMessage, setInitMessage] = useState('Initialisation de Grist...');

  useEffect(() => {
    async function initializeApp() {
      try {
        // Step 1: Initialize Grist API
        setInitMessage('🔌 Connexion à Grist...');
        await gristManager.initialize({ access: 'full' });

        // Step 2: Check and initialize demo data if needed
        setInitMessage('🗄️ Vérification des données...');
        const dataInitialized = await gristManager.checkAndInitializeDemoData();

        if (dataInitialized) {
          setInitMessage('📦 Données de démo créées avec succès !');
        } else {
          setInitMessage('✅ Données existantes détectées');
        }

        // Step 3: Ready!
        setTimeout(() => {
          setInitialized(true);
        }, 500);
      } catch (err) {
        console.error('Initialization error:', err);
        setError(
          err instanceof Error ? err.message : 'Erreur lors de l\'initialisation'
        );
      }
    }

    initializeApp();
  }, []);

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Erreur d'initialisation
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="text-6xl mb-6 animate-bounce">🪺</div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Grist App Nest
          </h1>
          <Loader size="lg" variant="spinner" text={initMessage} />
        </div>
      </div>
    );
  }

  // Main app
  return <Dashboard />;
}
