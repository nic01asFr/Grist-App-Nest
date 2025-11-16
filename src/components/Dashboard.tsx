/**
 * Dashboard Component - Level 1 (Main Container)
 *
 * Main application container with:
 * - Header with app name and logo
 * - Dynamic navbar from Pages table
 * - Page routing and rendering
 */

import { useState, useEffect, useMemo } from 'react';
import { useGristData } from '@api/hooks/useGristData';
import type { PageRecord } from '@core/types';

// Import all pages
import PageHome from '@pages/PageHome';
import PageClients from '@pages/PageClients';
import PageProducts from '@pages/PageProducts';
import PageSales from '@pages/PageSales';

const PAGE_COMPONENTS: Record<string, React.ComponentType> = {
  home: PageHome,
  clients: PageClients,
  products: PageProducts,
  sales: PageSales,
};

export default function Dashboard() {
  const [currentPage, setCurrentPage] = useState('home');
  const { data: pagesData, loading } = useGristData<PageRecord>('Pages');

  // Sort pages by order
  const pages = useMemo(() => {
    return [...pagesData].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [pagesData]);

  // Listen for navigation events
  useEffect(() => {
    const handleNavigation = (event: CustomEvent) => {
      setCurrentPage(event.detail.pageId);
    };

    window.addEventListener('navigate', handleNavigation as EventListener);
    return () => {
      window.removeEventListener('navigate', handleNavigation as EventListener);
    };
  }, []);

  // Get current page component
  const CurrentPageComponent = PAGE_COMPONENTS[currentPage] || PageHome;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🪺</div>
          <div className="text-xl font-semibold text-gray-700 animate-pulse">
            Chargement de l'application...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b-4 border-gradient-to-r from-blue-500 to-purple-600">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center gap-4">
              <div className="text-5xl">🪺</div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Grist App Nest
                </h1>
                <p className="text-sm text-gray-500">
                  Plateforme de gestion dynamique
                </p>
              </div>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-700">Admin</p>
                <p className="text-xs text-gray-500">
                  {new Date().toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                A
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Bar */}
      <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-6">
          <div className="flex gap-1">
            {pages.map((page) => (
              <button
                key={page.page_id}
                onClick={() => setCurrentPage(page.page_id)}
                className={`
                  flex items-center gap-2 px-6 py-4 font-semibold transition-all duration-200
                  border-b-4 hover:bg-gray-50
                  ${
                    currentPage === page.page_id
                      ? 'border-blue-600 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                <span className="text-xl">{page.icon}</span>
                <span>{page.page_name}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-xl min-h-[600px]">
          <CurrentPageComponent />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <p>
              © {new Date().getFullYear()} Grist App Nest - Powered by Grist
            </p>
            <p>Version 6.0</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
