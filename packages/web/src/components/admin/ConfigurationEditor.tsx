'use client';

import { useState } from 'react';

interface ConfigurationEditorProps {
  data: any;
  onUpdate: (updates: any) => void;
}

export function ConfigurationEditor({ data, onUpdate }: ConfigurationEditorProps) {
  const [formData, setFormData] = useState(data || {});
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await onUpdate(formData);
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving configuration:', error);
    }
  };

  const handleReset = () => {
    setFormData(data);
    setHasChanges(false);
  };

  const renderField = (key: string, value: any, path: string = '') => {
    const fullPath = path ? `${path}.${key}` : key;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return (
        <div key={fullPath} className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900 capitalize">
            {key.replace(/([A-Z])/g, ' $1').trim()}
          </h4>
          <div className="pl-4 border-l-2 border-gray-200 space-y-4">
            {Object.entries(value).map(([subKey, subValue]) =>
              renderField(subKey, subValue, fullPath)
            )}
          </div>
        </div>
      );
    }

    if (typeof value === 'boolean') {
      return (
        <div key={fullPath} className="flex items-center">
          <input
            type="checkbox"
            id={fullPath}
            checked={value}
            onChange={(e) => handleChange(fullPath, e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor={fullPath} className="ml-2 block text-sm text-gray-900 capitalize">
            {key.replace(/([A-Z])/g, ' $1').trim()}
          </label>
        </div>
      );
    }

    if (typeof value === 'number') {
      return (
        <div key={fullPath}>
          <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
            {key.replace(/([A-Z])/g, ' $1').trim()}
          </label>
          <input
            type="number"
            value={value}
            onChange={(e) => handleChange(fullPath, parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      );
    }

    if (Array.isArray(value)) {
      return (
        <div key={fullPath}>
          <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
            {key.replace(/([A-Z])/g, ' $1').trim()} (comma-separated)
          </label>
          <input
            type="text"
            value={value.join(', ')}
            onChange={(e) => handleChange(fullPath, e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      );
    }

    return (
      <div key={fullPath}>
        <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
          {key.replace(/([A-Z])/g, ' $1').trim()}
        </label>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => handleChange(fullPath, e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {Object.entries(formData).map(([key, value]) => renderField(key, value))}
      
      {hasChanges && (
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
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