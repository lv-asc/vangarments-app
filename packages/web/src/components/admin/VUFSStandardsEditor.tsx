'use client';

import { useState } from 'react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface VUFSCategoryOption {
  id: string;
  name: string;
  level: 'page' | 'blue' | 'white' | 'gray';
  parentId?: string;
  description?: string;
  isActive: boolean;
}

interface VUFSBrandOption {
  id: string;
  name: string;
  type: 'brand' | 'line' | 'collaboration';
  parentId?: string;
  description?: string;
  isActive: boolean;
}

interface VUFSColorOption {
  id: string;
  name: string;
  hex: string;
  undertones: string[];
  isActive: boolean;
}

interface VUFSMaterialOption {
  id: string;
  name: string;
  category: 'natural' | 'synthetic' | 'blend';
  properties: string[];
  isActive: boolean;
}

interface VUFSStandardsData {
  categories: VUFSCategoryOption[];
  brands: VUFSBrandOption[];
  colors: VUFSColorOption[];
  materials: VUFSMaterialOption[];
  careInstructions: any[];
}

interface VUFSStandardsEditorProps {
  data: VUFSStandardsData;
  onUpdate: (updates: any) => void;
}

export function VUFSStandardsEditor({ data, onUpdate }: VUFSStandardsEditorProps) {
  const [activeTab, setActiveTab] = useState<'categories' | 'brands' | 'colors' | 'materials'>('categories');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; item: any | null }>({ isOpen: false, item: null });
  const [deleting, setDeleting] = useState(false);

  const tabs = [
    { id: 'categories', name: 'Categories', count: data.categories?.length || 0 },
    { id: 'brands', name: 'Brands', count: data.brands?.length || 0 },
    { id: 'colors', name: 'Colors', count: data.colors?.length || 0 },
    { id: 'materials', name: 'Materials', count: data.materials?.length || 0 },
  ];

  const handleAddNew = () => {
    setEditingItem(null);
    setShowAddForm(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setShowAddForm(true);
  };

  const handleSave = async (formData: any) => {
    try {
      const endpoint = editingItem ? 'update' : 'add';
      const updates = [{
        type: activeTab.slice(0, -1), // Remove 's' from end (categories -> category)
        action: endpoint === 'add' ? 'add' : 'update',
        data: formData,
      }];

      await onUpdate({ updates });
      setShowAddForm(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving item:', error);
    }
  };

  const handleDeleteClick = (item: any) => {
    setDeleteConfirm({ isOpen: true, item });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.item) return;

    setDeleting(true);
    try {
      const updates = [{
        type: activeTab.slice(0, -1),
        action: 'delete',
        data: { id: deleteConfirm.item.id },
      }];

      await onUpdate({ updates });
    } catch (error) {
      console.error('Error deleting item:', error);
    } finally {
      setDeleting(false);
      setDeleteConfirm({ isOpen: false, item: null });
    }
  };

  const renderTabContent = () => {
    const currentData = data[activeTab] || [];

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
            {tabs.find(tab => tab.id === activeTab)?.name} ({currentData.length})
          </h3>
          <button
            onClick={handleAddNew}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add New {activeTab.slice(0, -1)}
          </button>
        </div>

        <div className="grid gap-4">
          {currentData.map((item: any) => (
            <div key={item.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{item.name}</h4>
                  {item.description && (
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {activeTab === 'categories' && (
                      <>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {item.level}
                        </span>
                        {item.parentId && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Parent: {item.parentId}
                          </span>
                        )}
                      </>
                    )}
                    {activeTab === 'brands' && (
                      <>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {item.type}
                        </span>
                        {item.parentId && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Parent: {item.parentId}
                          </span>
                        )}
                      </>
                    )}
                    {activeTab === 'colors' && (
                      <>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded border border-gray-300"
                            style={{ backgroundColor: item.hex }}
                          ></div>
                          <span className="text-xs text-gray-600">{item.hex}</span>
                        </div>
                        {item.undertones?.length > 0 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {item.undertones.join(', ')}
                          </span>
                        )}
                      </>
                    )}
                    {activeTab === 'materials' && (
                      <>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          {item.category}
                        </span>
                        {item.properties?.length > 0 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {item.properties.join(', ')}
                          </span>
                        )}
                      </>
                    )}
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${item.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                      }`}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(item)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(item)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {tab.name}
              <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <VUFSItemForm
          type={activeTab}
          item={editingItem}
          onSave={handleSave}
          onCancel={() => {
            setShowAddForm(false);
            setEditingItem(null);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, item: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete Item"
        message={`Are you sure you want to delete "${deleteConfirm.item?.name || ''}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}

interface VUFSItemFormProps {
  type: 'categories' | 'brands' | 'colors' | 'materials';
  item?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}

function VUFSItemForm({ type, item, onSave, onCancel }: VUFSItemFormProps) {
  const [formData, setFormData] = useState<any>(() => {
    if (item) return { ...item };

    const baseData = {
      name: '',
      description: '',
      isActive: true,
    };

    switch (type) {
      case 'categories':
        return { ...baseData, level: 'page', parentId: '' };
      case 'brands':
        return { ...baseData, type: 'brand', parentId: '' };
      case 'colors':
        return { ...baseData, hex: '#000000', undertones: [] };
      case 'materials':
        return { ...baseData, category: 'natural', properties: [] };
      default:
        return baseData;
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {item ? 'Edit' : 'Add New'} {type.slice(0, -1)}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            {type === 'categories' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Level *
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) => handleChange('level', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="page">Page</option>
                    <option value="blue">Blue</option>
                    <option value="white">White</option>
                    <option value="gray">Gray</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parent ID
                  </label>
                  <input
                    type="text"
                    value={formData.parentId || ''}
                    onChange={(e) => handleChange('parentId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}

            {type === 'brands' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleChange('type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="brand">Brand</option>
                    <option value="line">Line</option>
                    <option value="collaboration">Collaboration</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parent ID
                  </label>
                  <input
                    type="text"
                    value={formData.parentId || ''}
                    onChange={(e) => handleChange('parentId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}

            {type === 'colors' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hex Color *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.hex}
                      onChange={(e) => handleChange('hex', e.target.value)}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.hex}
                      onChange={(e) => handleChange('hex', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="#000000"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Undertones (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.undertones?.join(', ') || ''}
                    onChange={(e) => handleChange('undertones', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="warm, cool"
                  />
                </div>
              </>
            )}

            {type === 'materials' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="natural">Natural</option>
                    <option value="synthetic">Synthetic</option>
                    <option value="blend">Blend</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Properties (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.properties?.join(', ') || ''}
                    onChange={(e) => handleChange('properties', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="breathable, soft, durable"
                  />
                </div>
              </>
            )}

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => handleChange('isActive', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Active
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {item ? 'Update' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}