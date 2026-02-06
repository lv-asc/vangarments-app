'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from 'react-hot-toast';

interface ConfigurationBackup {
  id: string;
  timestamp: Date;
  userId: string;
  description: string;
  configType: string;
  filePath: string;
}

export function BackupManager() {
  const [backups, setBackups] = useState<ConfigurationBackup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rollbackConfirm, setRollbackConfirm] = useState<{ isOpen: boolean; backupId: string | null }>({ isOpen: false, backupId: null });
  const [rolling, setRolling] = useState(false);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<ConfigurationBackup[]>('/configuration/backups');
      setBackups(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load backups');
    } finally {
      setLoading(false);
    }
  };

  const handleRollbackClick = (backupId: string) => {
    setRollbackConfirm({ isOpen: true, backupId });
  };

  const handleRollbackConfirm = async () => {
    if (!rollbackConfirm.backupId) return;

    setRolling(true);
    try {
      const data = await apiClient.post<{ message: string }>(`/configuration/rollback/${rollbackConfirm.backupId}`);
      toast.success(data.message);

      // Reload backups to show the new backup created during rollback
      await loadBackups();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to rollback configuration');
    } finally {
      setRolling(false);
      setRollbackConfirm({ isOpen: false, backupId: null });
    }
  };

  const handleReloadConfiguration = async () => {
    try {
      const data = await apiClient.post<{ message: string }>('/configuration/reload');
      toast.success(data.message);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to reload configuration');
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getConfigTypeColor = (configType: string) => {
    switch (configType) {
      case 'vufs-standards':
        return 'bg-blue-100 text-blue-800';
      case 'system-settings':
        return 'bg-green-100 text-green-800';
      case 'ui-settings':
        return 'bg-purple-100 text-purple-800';
      case 'business-settings':
        return 'bg-orange-100 text-orange-800';
      case 'feature-toggles':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadBackups}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Backup & Restore</h2>
          <p className="mt-2 text-gray-600">
            Manage configuration backups and restore previous versions
          </p>
        </div>
        <button
          onClick={handleReloadConfiguration}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          Reload Configuration
        </button>
      </div>

      {backups.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No backups found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Configuration backups will appear here when you make changes.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {backups.map((backup) => (
            <div key={backup.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">
                      {backup.description}
                    </h3>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getConfigTypeColor(backup.configType)}`}>
                      {backup.configType}
                    </span>
                  </div>

                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      <span className="font-medium">Created:</span> {formatDate(backup.timestamp)}
                    </p>
                    <p>
                      <span className="font-medium">User ID:</span> {backup.userId}
                    </p>
                    <p>
                      <span className="font-medium">Backup ID:</span> {backup.id}
                    </p>
                  </div>
                </div>

                <div className="ml-4">
                  <button
                    onClick={() => handleRollbackClick(backup.id)}
                    className="px-3 py-1 text-sm font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Rollback
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Important Notes
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Backups are automatically created before any configuration changes</li>
                <li>Rolling back will create a new backup of the current state</li>
                <li>Some configuration changes may require an application restart</li>
                <li>Reload Configuration refreshes the system without requiring a restart</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Rollback Confirmation Dialog */}
      <ConfirmDialog
        isOpen={rollbackConfirm.isOpen}
        onClose={() => setRollbackConfirm({ isOpen: false, backupId: null })}
        onConfirm={handleRollbackConfirm}
        title="Confirm Rollback"
        message="Are you sure you want to rollback to this configuration? This action cannot be undone."
        confirmLabel="Rollback"
        cancelLabel="Cancel"
        variant="warning"
        loading={rolling}
      />
    </div>
  );
}