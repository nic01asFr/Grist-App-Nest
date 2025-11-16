/**
 * Dashboard Component - Level 1 (Main Container)
 *
 * Main application container with:
 * - Header with app name and logo
 * - Dynamic navbar from Templates table (category='pages')
 * - Dynamic page loading and rendering from Templates
 *
 * Components are loaded dynamically from the Templates table using ComponentLoader.
 * No hardcoded page imports - everything is data-driven!
 */

import { useState, useEffect, useMemo } from 'react';
import { useGristData } from '@api/hooks/useGristData';
import { componentLoader } from '@core/ComponentLoader';
import type { TemplateRecord, AppConfigRecord } from '@core/types';

export default function Dashboard() {
  const [currentPageId, setCurrentPageId] = useState('page-dashboard');
  const [loadedComponents, setLoadedComponents] = useState<Record<string, React.ComponentType<any>>>({});
  const [loadingComponent, setLoadingComponent] = useState(false);

  // Fetch page templates and app config
  const { data: templates, loading: templatesLoading } = useGristData<TemplateRecord>('Templates');
  const { data: appConfig } = useGristData<AppConfigRecord>('AppConfig');

  // Filter page templates and sort by name
  const pageTemplates = useMemo(() => {
    return templates
      .filter(t => t.category === 'pages' && t.is_active)
      .sort((a, b) => a.template_name.localeCompare(b.template_name));
  }, [templates]);

  // Get app configuration
  const appName = useMemo(() => {
    const config = appConfig.find(c => c.config_key === 'app_name');
    return config?.config_value || 'Grist CRM App Nest';
  }, [appConfig]);

  const defaultPage = useMemo(() => {
    const config = appConfig.find(c => c.config_key === 'default_page');
    return config?.config_value || 'page-dashboard';
  }, [appConfig]);

  // Set default page on mount
  useEffect(() => {
    setCurrentPageId(defaultPage);
  }, [defaultPage]);

  // Load component when page changes
  useEffect(() => {
    const loadComponent = async () => {
      // Skip if already loaded
      if (loadedComponents[currentPageId]) {
        return;
      }

      const template = templates.find(t => t.template_id === currentPageId);
      if (!template) {
        console.error(`Template not found: ${currentPageId}`);
        return;
      }

      setLoadingComponent(true);
      try {
        const component = await componentLoader.loadComponent(template);
        setLoadedComponents(prev => ({ ...prev, [currentPageId]: component }));
      } catch (error) {
        console.error(`Error loading component ${currentPageId}:`, error);
      } finally {
        setLoadingComponent(false);
      }
    };

    loadComponent();
  }, [currentPageId, templates, loadedComponents]);

  // Listen for navigation events
  useEffect(() => {
    const handleNavigation = (event: CustomEvent) => {
      setCurrentPageId(event.detail.pageId);
    };

    window.addEventListener('navigate', handleNavigation as EventListener);
    return () => {
      window.removeEventListener('navigate', handleNavigation as EventListener);
    };
  }, []);

  // Get current page component
  const CurrentPageComponent = loadedComponents[currentPageId];

  if (templatesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🪺</div>
          <div className="text-xl font-semibold text-gray-700 animate-pulse">
            Chargement des composants...
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
                  {appName}
                </h1>
                <p className="text-sm text-gray-500">
                  Plateforme de gestion CRM
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

      {/* Navigation Bar - Dynamic from Templates */}
      <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-6">
          <div className="flex gap-1">
            {pageTemplates.map((template) => (
              <button
                key={template.template_id}
                onClick={() => setCurrentPageId(template.template_id)}
                className={`
                  flex items-center gap-2 px-6 py-4 font-semibold transition-all duration-200
                  border-b-4 hover:bg-gray-50
                  ${
                    currentPageId === template.template_id
                      ? 'border-blue-600 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                <span>{template.template_name}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content - Dynamic Component Rendering */}
      <main className="container mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-xl min-h-[600px]">
          {loadingComponent ? (
            <div className="flex items-center justify-center py-24">
              <div className="text-center">
                <div className="text-4xl mb-4 animate-spin">⏳</div>
                <div className="text-lg font-semibold text-gray-700">
                  Chargement de la page...
                </div>
              </div>
            </div>
          ) : CurrentPageComponent ? (
            <CurrentPageComponent />
          ) : (
            <div className="flex items-center justify-center py-24">
              <div className="text-center">
                <div className="text-6xl mb-4">❌</div>
                <div className="text-lg font-semibold text-gray-700">
                  Page introuvable
                </div>
                <p className="text-gray-500 mt-2">
                  Le composant "{currentPageId}" n'a pas pu être chargé.
                </p>
              </div>
            </div>
          )}
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
