// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BrandAccount {
  id: string;
  brandInfo: {
    name: string;
  };
}

interface CatalogItem {
  id: string;
  vufsCode: string;
  name: string;
  description: string;
  category: {
    page: string;
    blueSubcategory: string;
    whiteSubcategory: string;
    graySubcategory: string;
  };
  brand: {
    name: string;
    line?: string;
    collaboration?: string;
  };
  pricing: {
    retailPrice: number;
    salePrice?: number;
    currency: string;
  };
  availability: 'available' | 'out_of_stock' | 'discontinued';
  images: Array<{
    url: string;
    type: 'front' | 'back' | 'detail';
  }>;
  metadata: {
    materials: Array<{
      name: string;
      percentage: number;
    }>;
    colors: string[];
    sizes: string[];
    careInstructions: string[];
  };
  purchaseLink?: string;
  createdAt: string;
  updatedAt: string;
}

interface BrandCatalogManagerProps {
  brandAccount: BrandAccount;
}

export default function BrandCatalogManager({ brandAccount }: BrandCatalogManagerProps) {
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterAvailability, setFilterAvailability] = useState('all');

  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    category: {
      page: '',
      blueSubcategory: '',
      whiteSubcategory: '',
      graySubcategory: ''
    },
    pricing: {
      retailPrice: 0,
      salePrice: 0,
      currency: 'BRL'
    },
    availability: 'available' as const,
    metadata: {
      materials: [{ name: '', percentage: 100 }],
      colors: [''],
      sizes: [''],
      careInstructions: ['']
    },
    purchaseLink: ''
  });

  useEffect(() => {
    loadCatalogItems();
  }, [brandAccount.id]);

  const loadCatalogItems = async () => {
    try {
      // Mock data for now - in real implementation, fetch from API
      const mockItems: CatalogItem[] = [
        {
          id: '1',
          vufsCode: 'VNG-001-2024',
          name: 'Summer Floral Dress',
          description: 'Elegant summer dress with floral pattern',
          category: {
            page: 'Clothing',
            blueSubcategory: 'Dresses',
            whiteSubcategory: 'Summer',
            graySubcategory: 'Casual'
          },
          brand: {
            name: brandAccount.brandInfo.name,
            line: 'Summer Collection'
          },
          pricing: {
            retailPrice: 299.90,
            salePrice: 249.90,
            currency: 'BRL'
          },
          availability: 'available',
          images: [
            { url: '/api/placeholder/300/400', type: 'front' }
          ],
          metadata: {
            materials: [
              { name: 'Cotton', percentage: 70 },
              { name: 'Polyester', percentage: 30 }
            ],
            colors: ['Blue', 'White'],
            sizes: ['P', 'M', 'G', 'GG'],
            careInstructions: ['Machine wash cold', 'Do not bleach', 'Tumble dry low']
          },
          purchaseLink: 'https://example.com/product/1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      setCatalogItems(mockItems);
    } catch (error) {
      console.error('Error loading catalog items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    try {
      // In real implementation, send to API
      const newCatalogItem: CatalogItem = {
        id: Date.now().toString(),
        vufsCode: `VNG-${Date.now()}`,
        ...newItem,
        brand: {
          name: brandAccount.brandInfo.name
        },
        images: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setCatalogItems([...catalogItems, newCatalogItem]);
      setShowAddModal(false);

      // Reset form
      setNewItem({
        name: '',
        description: '',
        category: {
          page: '',
          blueSubcategory: '',
          whiteSubcategory: '',
          graySubcategory: ''
        },
        pricing: {
          retailPrice: 0,
          salePrice: 0,
          currency: 'BRL'
        },
        availability: 'available',
        metadata: {
          materials: [{ name: '', percentage: 100 }],
          colors: [''],
          sizes: [''],
          careInstructions: ['']
        },
        purchaseLink: ''
      });
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const filteredItems = catalogItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category.page === filterCategory;
    const matchesAvailability = filterAvailability === 'all' || item.availability === filterAvailability;

    return matchesSearch && matchesCategory && matchesAvailability;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'out_of_stock': return 'bg-yellow-100 text-yellow-800';
      case 'discontinued': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Brand Catalog</h2>
          <p className="text-gray-500">
            Manage your product catalog following VUFS standards
          </p>
        </div>
        <motion.button
          onClick={() => setShowAddModal(true)}
          className="bg-gray-900 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-800 transition-colors shadow-sm text-sm"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Add Product
        </motion.button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            >
              <option value="all">All Categories</option>
              <option value="Clothing">Clothing</option>
              <option value="Shoes">Shoes</option>
              <option value="Accessories">Accessories</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
            <select
              value={filterAvailability}
              onChange={(e) => setFilterAvailability(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="discontinued">Discontinued</option>
            </select>
          </div>

          <div className="flex items-end">
            <motion.button
              onClick={() => {
                setSearchTerm('');
                setFilterCategory('all');
                setFilterAvailability('all');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium text-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Clear Filters
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Catalog Items */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {filteredItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            onClick={() => setSelectedItem(item)}
            whileHover={{ scale: 1.01 }}
          >
            <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
              {item.images.length > 0 ? (
                <img
                  src={item.images[0].url}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center flex-col text-gray-400">
                  <svg className="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs font-medium">No Image</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-gray-900 line-clamp-2 pr-2">{item.name}</h3>
                <div className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${getAvailabilityColor(item.availability)}`}>
                  {item.availability.replace(/_/g, ' ')}
                </div>
              </div>

              <p className="text-sm text-gray-500 line-clamp-2 min-h-[2.5em]">{item.description}</p>

              <div className="flex items-center justify-between pt-2">
                <div>
                  {item.pricing.salePrice && item.pricing.salePrice < item.pricing.retailPrice ? (
                    <div>
                      <div className="text-lg font-bold text-gray-900">
                        {formatCurrency(item.pricing.salePrice)}
                      </div>
                      <div className="text-sm text-gray-500 line-through">
                        {formatCurrency(item.pricing.retailPrice)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-lg font-bold text-gray-900">
                      {formatCurrency(item.pricing.retailPrice)}
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded">
                  {item.vufsCode}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-3">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No products found</h3>
          <p className="text-gray-500 mb-6 text-sm">
            {searchTerm || filterCategory !== 'all' || filterAvailability !== 'all'
              ? 'Try adjusting your filters or search terms'
              : 'Start building your catalog by adding your first product'
            }
          </p>
          <motion.button
            onClick={() => setShowAddModal(true)}
            className="bg-gray-900 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-800 transition-colors shadow-sm text-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Add First Product
          </motion.button>
        </div>
      )}

      {/* Add Item Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Add New Product</h3>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      placeholder="Summer Floral Dress"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category (Page) *
                    </label>
                    <select
                      value={newItem.category.page}
                      onChange={(e) => setNewItem({
                        ...newItem,
                        category: { ...newItem.category, page: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                      required
                    >
                      <option value="">Select category</option>
                      <option value="Clothing">Clothing</option>
                      <option value="Shoes">Shoes</option>
                      <option value="Accessories">Accessories</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    placeholder="Elegant summer dress with floral pattern..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Retail Price (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newItem.pricing.retailPrice}
                      onChange={(e) => setNewItem({
                        ...newItem,
                        pricing: { ...newItem.pricing, retailPrice: parseFloat(e.target.value) || 0 }
                      })}
                      placeholder="299.90"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sale Price (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newItem.pricing.salePrice}
                      onChange={(e) => setNewItem({
                        ...newItem,
                        pricing: { ...newItem.pricing, salePrice: parseFloat(e.target.value) || 0 }
                      })}
                      placeholder="249.90"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase Link
                  </label>
                  <input
                    type="url"
                    value={newItem.purchaseLink}
                    onChange={(e) => setNewItem({ ...newItem, purchaseLink: e.target.value })}
                    placeholder="https://yourbrand.com/product/123"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-8">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddItem}
                  disabled={!newItem.name || !newItem.category.page || !newItem.pricing.retailPrice}
                  className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 font-medium text-sm shadow-sm"
                >
                  Add Product
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}