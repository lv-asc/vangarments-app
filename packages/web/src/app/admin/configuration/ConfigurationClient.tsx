'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ConfigurationEditor } from '../../../components/admin/ConfigurationEditor';
import { VUFSStandardsEditor } from '../../../components/admin/VUFSStandardsEditor';
import { SystemSettingsEditor } from '../../../components/admin/SystemSettingsEditor';
import { BackupManager } from '../../../components/admin/BackupManager';
import { apiClient } from '@/lib/api';

interface ConfigurationSection {
  id: string;
  name: string;
  description: string;
  type: 'vufs' | 'ui' | 'business' | 'features';
  isEditable: boolean;
  requiresRestart: boolean;
  data: any;
}

export default function ConfigurationPage() {
  const { user } = useAuth();
  const [configurations, setConfigurations] = useState<ConfigurationSection[]>([]);
  const [activeSection, setActiveSection] = useState<string>('vufs-standards');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.roles?.includes('admin')) {
      loadConfigurations();
    }
  }, [user]);

  const loadConfigurations = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<ConfigurationSection[]>('/configuration');
      setConfigurations(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigurationUpdate = async (sectionId: string, updates: any) => {
    try {
      if (sectionId === 'vufs-standards') {
        await apiClient.put('/configuration/vufs-standards', updates);
      } else if (sectionId === 'system-settings') {
        await apiClient.put('/configuration/system-settings', updates);
      } else {
        await apiClient.put(`/configuration/${sectionId}`, updates);
      }

      // Reload configurations to reflect changes
      await loadConfigurations();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update configuration');
    }
  };

  if (!user || !user.roles?.includes('admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadConfigurations}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const activeConfig = configurations.find(config => config.id === activeSection);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Configuration Management</h1>
          <p className="mt-2 text-gray-600">
            Manage VUFS standards, system settings, and application configuration
          </p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <nav className="bg-white rounded-lg shadow">
              <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuration Sections</h2>
                <ul className="space-y-2">
                  {configurations.map((config) => (
                    <li key={config.id}>
                      <button
                        onClick={() => setActiveSection(config.id)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          activeSection === config.id
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {config.name}
                        {config.requiresRestart && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            Restart Required
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                  <li>
                    <button
                      onClick={() => setActiveSection('backups')}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeSection === 'backups'
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Backup & Restore
                    </button>
                  </li>
                </ul>
              </div>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow">
              {activeSection === 'backups' ? (
                <BackupManager />
              ) : activeConfig ? (
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">{activeConfig.name}</h2>
                    <p className="mt-2 text-gray-600">{activeConfig.description}</p>
                    {activeConfig.requiresRestart && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                              Changes to this configuration require an application restart to take effect.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {activeConfig.type === 'vufs' && (
                    <VUFSStandardsEditor
                      data={activeConfig.data}
                      onUpdate={(updates) => handleConfigurationUpdate(activeConfig.id, updates)}
                    />
                  )}

                  {(activeConfig.type === 'ui' || activeConfig.type === 'business' || activeConfig.type === 'features') && (
                    <SystemSettingsEditor
                      type={activeConfig.type}
                      data={activeConfig.data}
                      onUpdate={(updates: any) => handleConfigurationUpdate(activeConfig.id, updates)}
                    />
                  )}
                </div>
              ) : (
                <div className="p-6">
                  <p className="text-gray-500">Select a configuration section to edit.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}