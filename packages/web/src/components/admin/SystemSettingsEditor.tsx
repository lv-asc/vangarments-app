'use client';

import { useState } from 'react';

interface SystemSettingsEditorProps {
  type: 'ui' | 'business' | 'features';
  data: any;
  onUpdate: (updates: any) => void;
}

export function SystemSettingsEditor({ type, data, onUpdate }: SystemSettingsEditorProps) {
  const [formData, setFormData] = useState(data || {});
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleNestedChange = (parent: string, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await onUpdate(formData);
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleReset = () => {
    setFormData(data);
    setHasChanges(false);
  };

  const renderUISettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Theme
          </label>
          <select
            value={formData.theme || 'light'}
            onChange={(e) => handleChange('theme', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="auto">Auto</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Language
          </label>
          <select
            value={formData.language || 'en'}
            onChange={(e) => handleChange('language', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="en">English (US)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date Format
          </label>
          <select
            value={formData.dateFormat || 'MM/DD/YYYY'}
            onChange={(e) => handleChange('dateFormat', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Currency
          </label>
          <select
            value={formData.currency || 'BRL'}
            onChange={(e) => handleChange('currency', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="BRL">Brazilian Real (BRL)</option>
            <option value="USD">US Dollar (USD)</option>
            <option value="EUR">Euro (EUR)</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">


        <div className="flex items-center">
          <input
            type="checkbox"
            id="enableAnimations"
            checked={formData.enableAnimations !== false}
            onChange={(e) => handleChange('enableAnimations', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="enableAnimations" className="ml-2 block text-sm text-gray-900">
            Enable Animations
          </label>
        </div>
      </div>
    </div>
  );

  const renderBusinessSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Commission Rate (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={(formData.defaultCommissionRate || 0.30) * 100}
            onChange={(e) => handleChange('defaultCommissionRate', parseFloat(e.target.value) / 100)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Payout (BRL)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.minimumPayout || 50.00}
            onChange={(e) => handleChange('minimumPayout', parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Auto Repass Threshold (BRL)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.autoRepassThreshold || 1000.00}
            onChange={(e) => handleChange('autoRepassThreshold', parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Terms (days)
          </label>
          <input
            type="number"
            min="1"
            max="90"
            value={formData.paymentTerms || 7}
            onChange={(e) => handleChange('paymentTerms', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            High Value Threshold (BRL)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.highValueThreshold || 500.00}
            onChange={(e) => handleChange('highValueThreshold', parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="enableAutoRepass"
            checked={formData.enableAutoRepass !== false}
            onChange={(e) => handleChange('enableAutoRepass', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="enableAutoRepass" className="ml-2 block text-sm text-gray-900">
            Enable Auto Repass
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="requireReceiptForHighValue"
            checked={formData.requireReceiptForHighValue !== false}
            onChange={(e) => handleChange('requireReceiptForHighValue', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="requireReceiptForHighValue" className="ml-2 block text-sm text-gray-900">
            Require Receipt for High Value Items
          </label>
        </div>
      </div>
    </div>
  );

  const renderFeatureSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900">Core Features</h4>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="enableAI"
              checked={formData.enableAI !== false}
              onChange={(e) => handleChange('enableAI', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="enableAI" className="ml-2 block text-sm text-gray-900">
              Enable AI Processing
            </label>
          </div>



          <div className="flex items-center">
            <input
              type="checkbox"
              id="enableAnalytics"
              checked={formData.enableAnalytics !== false}
              onChange={(e) => handleChange('enableAnalytics', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="enableAnalytics" className="ml-2 block text-sm text-gray-900">
              Enable Analytics
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900">Advanced Features</h4>



          <div className="flex items-center">
            <input
              type="checkbox"
              id="enableAdvancedSearch"
              checked={formData.enableAdvancedSearch !== false}
              onChange={(e) => handleChange('enableAdvancedSearch', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="enableAdvancedSearch" className="ml-2 block text-sm text-gray-900">
              Enable Advanced Search
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="enableRecommendations"
              checked={formData.enableRecommendations !== false}
              onChange={(e) => handleChange('enableRecommendations', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="enableRecommendations" className="ml-2 block text-sm text-gray-900">
              Enable Recommendations
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (type) {
      case 'ui':
        return renderUISettings();
      case 'business':
        return renderBusinessSettings();
      case 'features':
        return renderFeatureSettings();
      default:
        return <div>Unknown settings type</div>;
    }
  };

  return (
    <div>
      {renderContent()}

      {hasChanges && (
        <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-200">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Reset Changes
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
}