// @ts-nocheck
'use client';

import { useState, useRef, useCallback } from 'react';
import { useData } from '@/contexts/DataContext';
import {
  HomeIcon,
  MagnifyingGlassIcon,
  CameraIcon,
  ShoppingBagIcon,
  UserIcon,
  PlusIcon,
  HeartIcon,
  TrashIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  MagnifyingGlassCircleIcon,
  SparklesIcon,
  PhotoIcon,
  XMarkIcon,
  CheckIcon,
  StarIcon,
  TagIcon,
  EyeIcon,
  ShareIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

export default function MobileSimulator() {
  const { userProfile, wardrobeItems, marketplaceItems, addWardrobeItem, updateUserProfile, isLoading } = useData();
  const [activeTab, setActiveTab] = useState('wardrobe');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showItemDetail, setShowItemDetail] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleFavorite = (itemId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(itemId)) {
      newFavorites.delete(itemId);
    } else {
      newFavorites.add(itemId);
    }
    setFavorites(newFavorites);

    // Add haptic feedback simulation
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const categories = ['all', 'tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories'];

  const filteredItems = wardrobeItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' ||
      item.category.toLowerCase() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setShowCamera(true);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const processImage = async () => {
    if (!selectedImage) return;

    setIsProcessing(true);

    // Simulate AI processing with realistic delay
    await new Promise(resolve => setTimeout(resolve, 2500));

    const aiDetectedItem = {
      name: 'AI-Detected Fashion Item',
      category: 'Tops',
      subcategory: 'T-Shirts',
      brand: 'Smart Detection',
      color: 'Multi-color',
      size: 'M',
      image: selectedImage,
      description: 'Automatically cataloged using AI vision technology',
      condition: 'excellent' as const,
      tags: ['ai-detected', 'smart-catalog', 'new'],
      price: Math.floor(Math.random() * 100) + 20
    };

    addWardrobeItem(aiDetectedItem);
    setIsProcessing(false);
    setSelectedImage(null);
    setShowCamera(false);

    // Success feedback
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
  };

  const handleAddItem = () => {
    // Navigate to add item page instead of using sample data
    window.location.href = '/wardrobe/add';
  };

  const handleProfileImageUpload = () => {
    // Trigger file input for real image upload
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Handle real image upload
        console.log('Uploading profile image:', file);
        // This would call the real API
      }
    };
    input.click();
  };

  if (isLoading) {
    return (
      <div className="mobile-container">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container">
      {/* Status Bar */}
      <div className="status-bar">
        <span>19:32</span>
        <div className="status-icons">
          <span>📶</span>
          <span>📶</span>
          <span>🔋</span>
        </div>
      </div>

      {/* Header */}
      <div className="mobile-header">
        <div className="logo-container">
          <div className="mobile-logo">V</div>
          <span className="app-name">Vangarments</span>
        </div>
      </div>

      {/* Content */}
      <div className="mobile-content">
        {activeTab === 'wardrobe' && (
          <div className="tab-content">
            {/* Enhanced Header */}
            <div className="wardrobe-header">
              <div className="header-top">
                <div>
                  <h2>My Wardrobe</h2>
                  <p>{filteredItems.length} of {wardrobeItems.length} items</p>
                </div>
                <div className="header-actions">
                  <button
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    className="view-toggle"
                  >
                    {viewMode === 'grid' ? <ListBulletIcon className="w-5 h-5" /> : <Squares2X2Icon className="w-5 h-5" />}
                  </button>
                  <button onClick={() => setShowFilters(!showFilters)} className="filter-btn">
                    <FunnelIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="search-container">
                <MagnifyingGlassIcon className="w-5 h-5 search-icon" />
                <input
                  type="text"
                  placeholder="Search your wardrobe..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="clear-search">
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Category Filter */}
              {showFilters && (
                <div className="filter-section">
                  <div className="category-filters">
                    {categories.map(category => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`category-chip ${selectedCategory === category ? 'active' : ''}`}
                      >
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Items Display */}
            {filteredItems.length === 0 ? (
              <div className="empty-state">
                {searchQuery || selectedCategory !== 'all' ? (
                  <>
                    <MagnifyingGlassCircleIcon className="w-16 h-16 text-gray-300" />
                    <h3>No items found</h3>
                    <p>Try adjusting your search or filters</p>
                    <button onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }} className="reset-btn">
                      Reset Filters
                    </button>
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-16 h-16 text-gray-300" />
                    <h3>Start Your Digital Wardrobe</h3>
                    <p>Add your first items to begin organizing your fashion collection</p>
                    <button onClick={handleAddItem} className="primary-btn">
                      <PlusIcon className="w-5 h-5" />
                      Add Your First Item
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className={`items-container ${viewMode}`}>
                {filteredItems.map((item) => (
                  <div key={item.id} className="enhanced-item-card" onClick={() => setShowItemDetail(item)}>
                    <div className="item-image-container">
                      <img src={item.image} alt={item.name} className="item-image" />

                      {/* Condition Badge */}
                      <div className={`condition-badge ${item.condition}`}>
                        {item.condition}
                      </div>

                      {/* Favorite Button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}
                        className="favorite-btn"
                      >
                        {favorites.has(item.id) ? (
                          <HeartSolidIcon className="w-5 h-5 text-red-500" />
                        ) : (
                          <HeartIcon className="w-5 h-5 text-white" />
                        )}
                      </button>

                      {/* Quick Actions */}
                      <div className="quick-actions">
                        <button className="quick-action">
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button className="quick-action">
                          <ShareIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="item-details">
                      <div className="item-main-info">
                        <h4>{item.name}</h4>
                        <p className="brand">{item.brand}</p>
                        <div className="item-meta">
                          <span className="category">{item.category}</span>
                          <span className="size">Size {item.size}</span>
                          <span className="color">{item.color}</span>
                        </div>
                      </div>

                      {item.price && (
                        <div className="price-section">
                          <span className="price">${item.price}</span>
                        </div>
                      )}

                      {/* Tags */}
                      {item.tags && item.tags.length > 0 && (
                        <div className="tags-container">
                          {item.tags.slice(0, 3).map((tag: string) => (
                            <span key={tag} className="tag">
                              {tag}
                            </span>
                          ))}
                          {item.tags.length > 3 && (
                            <span className="tag more">+{item.tags.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Floating Add Button */}
            <button onClick={handleAddItem} className="floating-add-btn">
              <PlusIcon className="w-6 h-6" />
            </button>
          </div>
        )}

        {activeTab === 'search' && (
          <div className="tab-content">
            <div className="status-bar">
              <span>9:41</span>
              <div className="icons">
                <span className="icon">Wi-Fi</span>
                <span className="icon">Battery</span>
              </div>
            </div>
            <h2>Search</h2>
            <div className="search-bar">
              <span className="icon">🔍</span>
              <input type="text" placeholder="Search..." />
            </div>
            <div className="discover-content">
              <div className="card">
                <div className="card-image" style={{ background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)' }}></div>
                <div className="card-info">
                  <h3>Summer Vibes</h3>
                  <p>Trending now</p>
                </div>
              </div>
              <div className="card">
                <div className="card-image" style={{ background: 'linear-gradient(45deg, #A8E6CF, #DCEDC1)' }}></div>
                <div className="card-info">
                  <h3>Eco Friendly</h3>
                  <p>Sustainable fashion</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'camera' && (
          <div className="tab-content camera-tab">
            <div className="camera-header">
              <h2>Add New Item</h2>
              <p>Capture or upload photos of your fashion items</p>
            </div>

            {!showCamera ? (
              <>
                {/* Camera Actions */}
                <div className="camera-actions">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="camera-action-btn primary"
                  >
                    <CameraIcon className="w-8 h-8" />
                    <span>Take Photo</span>
                    <p>Use your camera</p>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="camera-action-btn secondary"
                  >
                    <PhotoIcon className="w-8 h-8" />
                    <span>Choose Photo</span>
                    <p>From gallery</p>
                  </button>
                </div>

                {/* AI Features Preview */}
                <div className="ai-features">
                  <h3>AI-Powered Features</h3>
                  <div className="feature-grid">
                    <div className="feature-item">
                      <SparklesIcon className="w-6 h-6" />
                      <div>
                        <h4>Smart Recognition</h4>
                        <p>Auto-detect item type, brand, and color</p>
                      </div>
                    </div>
                    <div className="feature-item">
                      <TagIcon className="w-6 h-6" />
                      <div>
                        <h4>Auto Tagging</h4>
                        <p>Intelligent categorization and tags</p>
                      </div>
                    </div>
                    <div className="feature-item">
                      <EyeIcon className="w-6 h-6" />
                      <div>
                        <h4>Style Analysis</h4>
                        <p>Get style suggestions and matches</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Add Demo */}
                <div className="demo-section">
                  <h3>Try Demo Mode</h3>
                  <p>Add sample items to see how the app works</p>
                  <button onClick={handleAddItem} className="demo-btn">
                    <SparklesIcon className="w-5 h-5" />
                    Add Sample Item
                  </button>
                </div>
              </>
            ) : (
              /* Camera Processing View */
              <div className="camera-processing">
                <div className="image-preview">
                  <img src={selectedImage!} alt="Selected item" />
                  <button
                    onClick={() => { setShowCamera(false); setSelectedImage(null); }}
                    className="close-btn"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                {isProcessing ? (
                  <div className="processing-state">
                    <div className="processing-spinner">
                      <ArrowPathIcon className="w-8 h-8 animate-spin" />
                    </div>
                    <h3>Processing Image...</h3>
                    <p>AI is analyzing your item</p>
                    <div className="processing-steps">
                      <div className="step active">Detecting item type</div>
                      <div className="step active">Analyzing colors</div>
                      <div className="step">Generating tags</div>
                    </div>
                  </div>
                ) : (
                  <div className="processing-actions">
                    <button onClick={processImage} className="process-btn">
                      <SparklesIcon className="w-5 h-5" />
                      Process with AI
                    </button>
                    <button
                      onClick={() => { setShowCamera(false); setSelectedImage(null); }}
                      className="cancel-btn"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        )}

        {activeTab === 'marketplace' && (
          <div className="tab-content">
            <div className="content-header">
              <h2>Marketplace</h2>
              <p>{marketplaceItems.length} items available</p>
            </div>
            <div className="items-grid">
              {marketplaceItems.map((item) => (
                <div key={item.id} className="item-card">
                  <div className="item-image-container">
                    <img src={item.images[0]} alt={item.description} className="item-image" />
                    <div className="price-badge">${item.price}</div>
                  </div>
                  <div className="item-info">
                    <h4>{item.brand}</h4>
                    <p>{item.description.substring(0, 30)}...</p>
                    <span className="condition-badge">{item.condition}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="tab-content">
            <div className="profile-header">
              <div className="profile-avatar-container">
                {userProfile?.profileImage ? (
                  <img src={userProfile.profileImage} alt="Profile" className="profile-avatar" />
                ) : (
                  <div className="profile-avatar-placeholder">
                    {userProfile?.name?.charAt(0) || 'U'}
                  </div>
                )}
                <button onClick={handleProfileImageUpload} className="camera-overlay">
                  <CameraIcon className="w-4 h-4" />
                </button>
              </div>
              <h2>{userProfile?.name || 'User'}</h2>
              <p>@{userProfile?.username || 'username'}</p>
              {userProfile?.bio && <p className="bio">{userProfile.bio}</p>}
            </div>

            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-number">{userProfile?.stats.wardrobeItems || 0}</span>
                <span className="stat-label">Items</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{userProfile?.stats.outfitsCreated || 0}</span>
                <span className="stat-label">Outfits</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{userProfile?.stats.followers || 0}</span>
                <span className="stat-label">Followers</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{userProfile?.stats.following || 0}</span>
                <span className="stat-label">Following</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <button
          onClick={() => setActiveTab('wardrobe')}
          className={`nav-item ${activeTab === 'wardrobe' ? 'active' : ''}`}
        >
          <HomeIcon className="w-6 h-6" />
          <span>Wardrobe</span>
        </button>
        <div
          onClick={() => setActiveTab('search')}
          className={`nav-item ${activeTab === 'search' ? 'active' : ''}`}
        >
          <span className="icon">🔍</span>
          <span>Search</span>
        </div>
        <button
          onClick={() => setActiveTab('camera')}
          className={`nav-item ${activeTab === 'camera' ? 'active' : ''}`}
        >
          <CameraIcon className="w-6 h-6" />
          <span>Add</span>
        </button>
        <button
          onClick={() => setActiveTab('marketplace')}
          className={`nav-item ${activeTab === 'marketplace' ? 'active' : ''}`}
        >
          <ShoppingBagIcon className="w-6 h-6" />
          <span>Shop</span>
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
        >
          <UserIcon className="w-6 h-6" />
          <span>Profile</span>
        </button>
      </div>

      {/* Item Detail Modal */}
      {showItemDetail && (
        <div className="modal-overlay" onClick={() => setShowItemDetail(null)}>
          <div className="item-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <button onClick={() => setShowItemDetail(null)} className="modal-close">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="modal-content">
              <div className="detail-image">
                <img src={showItemDetail.image} alt={showItemDetail.name} />
                <button
                  onClick={() => toggleFavorite(showItemDetail.id)}
                  className="detail-favorite"
                >
                  {favorites.has(showItemDetail.id) ? (
                    <HeartSolidIcon className="w-6 h-6 text-red-500" />
                  ) : (
                    <HeartIcon className="w-6 h-6" />
                  )}
                </button>
              </div>

              <div className="detail-info">
                <div className="detail-header">
                  <h2>{showItemDetail.name}</h2>
                  <div className="detail-rating">
                    {[...Array(5)].map((_, i) => (
                      <StarSolidIcon key={i} className="w-4 h-4 text-yellow-400" />
                    ))}
                  </div>
                </div>

                <p className="detail-brand">{showItemDetail.brand}</p>
                {showItemDetail.price && (
                  <p className="detail-price">${showItemDetail.price}</p>
                )}

                <div className="detail-specs">
                  <div className="spec-item">
                    <span>Category</span>
                    <span>{showItemDetail.category}</span>
                  </div>
                  <div className="spec-item">
                    <span>Size</span>
                    <span>{showItemDetail.size}</span>
                  </div>
                  <div className="spec-item">
                    <span>Color</span>
                    <span>{showItemDetail.color}</span>
                  </div>
                  <div className="spec-item">
                    <span>Condition</span>
                    <span className={`condition-text ${showItemDetail.condition}`}>
                      {showItemDetail.condition}
                    </span>
                  </div>
                </div>

                {showItemDetail.description && (
                  <div className="detail-description">
                    <h4>Description</h4>
                    <p>{showItemDetail.description}</p>
                  </div>
                )}

                {showItemDetail.tags && showItemDetail.tags.length > 0 && (
                  <div className="detail-tags">
                    <h4>Tags</h4>
                    <div className="tags-list">
                      {showItemDetail.tags.map((tag: string) => (
                        <span key={tag} className="detail-tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="detail-actions">
                  <button className="action-btn primary">
                    <ShareIcon className="w-5 h-5" />
                    Share
                  </button>
                  <button className="action-btn secondary">
                    <TrashIcon className="w-5 h-5" />
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .mobile-container {
          max-width: 375px;
          height: 812px;
          margin: 20px auto;
          background: #000;
          border-radius: 40px;
          padding: 8px;
          box-shadow: 0 25px 50px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1);
          overflow: hidden;
          position: relative;
          backdrop-filter: blur(20px);
        }

        .mobile-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 150px;
          height: 30px;
          background: #000;
          border-radius: 0 0 20px 20px;
          z-index: 10;
        }

        .status-bar {
          background: #000;
          color: white;
          padding: 8px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
          font-weight: 600;
        }

        .status-icons {
          display: flex;
          gap: 4px;
        }

        .mobile-header {
          background: #00132d;
          padding: 16px 20px;
          text-align: center;
        }

        .logo-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .mobile-logo {
          width: 40px;
          height: 40px;
          background: #fff7d7;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #00132d;
          font-weight: bold;
          font-size: 20px;
        }

        .app-name {
          color: #fff7d7;
          font-size: 20px;
          font-weight: bold;
        }

        .mobile-content {
          background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
          flex: 1;
          overflow-y: auto;
          height: calc(100% - 140px);
          position: relative;
        }

        .tab-content {
          padding: 20px;
          height: 100%;
        }

        .content-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .content-header h2 {
          font-size: 24px;
          font-weight: bold;
          color: #111827;
          margin: 0;
        }

        .content-header p {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        .add-btn {
          background: #00132d;
          color: #fff7d7;
          border: none;
          border-radius: 20px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .items-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .item-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .item-image-container {
          position: relative;
        }

        .item-image {
          width: 100%;
          height: 120px;
          object-fit: cover;
        }

        .favorite-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(255,255,255,0.9);
          border: none;
          border-radius: 16px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .price-badge {
          position: absolute;
          bottom: 8px;
          right: 8px;
          background: #00132d;
          color: #fff7d7;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
        }

        .item-info {
          padding: 12px;
        }

        .item-info h4 {
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 4px 0;
          color: #111827;
        }

        .item-info p {
          font-size: 12px;
          color: #6b7280;
          margin: 0 0 8px 0;
        }

        .item-price {
          font-size: 14px;
          font-weight: bold;
          color: #10b981;
        }

        .condition-badge {
          background: #f3f4f6;
          color: #374151;
          padding: 2px 8px;
          border-radius: 8px;
          font-size: 10px;
          font-weight: 500;
        }

        .discover-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .trend-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .trend-card img {
          width: 100%;
          height: 150px;
          object-fit: cover;
        }

        .trend-card h3 {
          padding: 12px 16px 4px;
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }

        .trend-card p {
          padding: 0 16px 12px;
          margin: 0;
          font-size: 14px;
          color: #6b7280;
        }

        .camera-content {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 300px;
        }

        .camera-placeholder {
          text-align: center;
        }

        .camera-placeholder p {
          margin: 16px 0;
          color: #6b7280;
        }

        .camera-btn {
          background: #00132d;
          color: #fff7d7;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        }

        .profile-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .profile-avatar-container {
          position: relative;
          display: inline-block;
          margin-bottom: 16px;
        }

        .profile-avatar {
          width: 80px;
          height: 80px;
          border-radius: 40px;
          object-fit: cover;
        }

        .profile-avatar-placeholder {
          width: 80px;
          height: 80px;
          border-radius: 40px;
          background: #00132d;
          color: #fff7d7;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: bold;
        }

        .camera-overlay {
          position: absolute;
          bottom: 0;
          right: 0;
          background: #00132d;
          color: #fff7d7;
          border: none;
          border-radius: 16px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .profile-header h2 {
          margin: 0 0 4px 0;
          font-size: 20px;
          font-weight: bold;
        }

        .profile-header p {
          margin: 0 0 8px 0;
          color: #6b7280;
        }

        .bio {
          font-style: italic;
          color: #374151;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .stat-item {
          text-align: center;
        }

        .stat-number {
          display: block;
          font-size: 20px;
          font-weight: bold;
          color: #00132d;
        }

        .stat-label {
          font-size: 12px;
          color: #6b7280;
        }

        .bottom-nav {
          background: white;
          display: flex;
          border-top: 1px solid #e5e7eb;
          padding: 8px 0 20px 0;
        }

        .nav-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          padding: 8px;
          cursor: pointer;
          color: #9ca3af;
          transition: color 0.2s;
        }

        .nav-item.active {
          color: #00132d;
        }

        .nav-item span {
          font-size: 10px;
          font-weight: 500;
        }

        /* Enhanced Wardrobe Styles */
        .wardrobe-header {
          background: white;
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
          position: sticky;
          top: 0;
          z-index: 10;
          backdrop-filter: blur(20px);
          background: rgba(255, 255, 255, 0.95);
        }

        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .header-top h2 {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }

        .header-top p {
          font-size: 14px;
          color: #6b7280;
          margin: 4px 0 0 0;
        }

        .header-actions {
          display: flex;
          gap: 8px;
        }

        .view-toggle, .filter-btn {
          background: #f3f4f6;
          border: none;
          border-radius: 8px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .view-toggle:hover, .filter-btn:hover {
          background: #e5e7eb;
          transform: scale(1.05);
        }

        .search-container {
          position: relative;
          margin-bottom: 16px;
        }

        .search-input {
          width: 100%;
          padding: 12px 16px 12px 44px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 16px;
          background: #f9fafb;
          transition: all 0.2s;
        }

        .search-input:focus {
          outline: none;
          border-color: #00132d;
          background: white;
          box-shadow: 0 0 0 3px rgba(1, 19, 45, 0.1);
        }

        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
        }

        .clear-search {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: #e5e7eb;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .filter-section {
          animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .category-filters {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 8px;
        }

        .category-chip {
          background: #f3f4f6;
          border: none;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .category-chip.active {
          background: #00132d;
          color: #fff7d7;
          transform: scale(1.05);
        }

        .category-chip:hover {
          background: #e5e7eb;
        }

        .category-chip.active:hover {
          background: #001a3d;
        }

        /* Enhanced Item Cards */
        .items-container {
          padding: 20px;
        }

        .items-container.grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .items-container.list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .enhanced-item-card {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transition: all 0.3s ease;
          cursor: pointer;
          position: relative;
        }

        .enhanced-item-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }

        .enhanced-item-card:active {
          transform: translateY(-2px);
        }

        .item-image-container {
          position: relative;
          overflow: hidden;
        }

        .item-image {
          width: 100%;
          height: 160px;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .enhanced-item-card:hover .item-image {
          transform: scale(1.05);
        }

        .condition-badge {
          position: absolute;
          top: 8px;
          left: 8px;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          backdrop-filter: blur(10px);
        }

        .condition-badge.new {
          background: rgba(16, 185, 129, 0.9);
          color: white;
        }

        .condition-badge.excellent {
          background: rgba(59, 130, 246, 0.9);
          color: white;
        }

        .condition-badge.good {
          background: rgba(245, 158, 11, 0.9);
          color: white;
        }

        .condition-badge.fair {
          background: rgba(249, 115, 22, 0.9);
          color: white;
        }

        .favorite-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(0, 0, 0, 0.5);
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          backdrop-filter: blur(10px);
        }

        .favorite-btn:hover {
          background: rgba(0, 0, 0, 0.7);
          transform: scale(1.1);
        }

        .quick-actions {
          position: absolute;
          bottom: 8px;
          right: 8px;
          display: flex;
          gap: 4px;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .enhanced-item-card:hover .quick-actions {
          opacity: 1;
        }

        .quick-action {
          background: rgba(255, 255, 255, 0.9);
          border: none;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          backdrop-filter: blur(10px);
        }

        .quick-action:hover {
          background: white;
          transform: scale(1.1);
        }

        .item-details {
          padding: 12px;
        }

        .item-main-info h4 {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 4px 0;
          line-height: 1.3;
        }

        .brand {
          font-size: 12px;
          color: #00132d;
          font-weight: 500;
          margin: 0 0 6px 0;
        }

        .item-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 8px;
        }

        .item-meta span {
          font-size: 10px;
          color: #6b7280;
          background: #f3f4f6;
          padding: 2px 6px;
          border-radius: 6px;
        }

        .price-section {
          margin-bottom: 8px;
        }

        .price {
          font-size: 16px;
          font-weight: 700;
          color: #10b981;
        }

        .tags-container {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }

        .tag {
          background: #fff7d7;
          color: #00132d;
          font-size: 9px;
          font-weight: 500;
          padding: 2px 6px;
          border-radius: 6px;
        }

        .tag.more {
          background: #e5e7eb;
          color: #6b7280;
        }

        /* Floating Add Button */
        .floating-add-btn {
          position: fixed;
          bottom: 90px;
          right: 20px;
          background: linear-gradient(135deg, #00132d 0%, #001a3d 100%);
          color: #fff7d7;
          border: none;
          border-radius: 50%;
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 8px 25px rgba(1, 19, 45, 0.3);
          transition: all 0.3s ease;
          z-index: 100;
        }

        .floating-add-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 12px 35px rgba(1, 19, 45, 0.4);
        }

        .floating-add-btn:active {
          transform: scale(0.95);
        }

        /* Enhanced Camera Styles */
        .camera-tab {
          padding: 0;
        }

        .camera-header {
          background: white;
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
        }

        .camera-header h2 {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 4px 0;
        }

        .camera-header p {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        .camera-actions {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .camera-action-btn {
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: left;
        }

        .camera-action-btn.primary {
          border-color: #00132d;
          background: linear-gradient(135deg, #00132d 0%, #001a3d 100%);
          color: #fff7d7;
        }

        .camera-action-btn.secondary {
          background: white;
        }

        .camera-action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        }

        .camera-action-btn span {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 4px;
          display: block;
        }

        .camera-action-btn p {
          font-size: 14px;
          opacity: 0.8;
          margin: 0;
        }

        .ai-features {
          padding: 20px;
          background: white;
          margin: 8px 20px;
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .ai-features h3 {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 16px 0;
        }

        .feature-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .feature-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .feature-item svg {
          color: #00132d;
          margin-top: 2px;
        }

        .feature-item h4 {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 2px 0;
        }

        .feature-item p {
          font-size: 12px;
          color: #6b7280;
          margin: 0;
          line-height: 1.4;
        }

        .demo-section {
          padding: 20px;
          text-align: center;
        }

        .demo-section h3 {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 8px 0;
        }

        .demo-section p {
          font-size: 14px;
          color: #6b7280;
          margin: 0 0 16px 0;
        }

        .demo-btn {
          background: #fff7d7;
          color: #00132d;
          border: 2px solid #00132d;
          border-radius: 12px;
          padding: 12px 20px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .demo-btn:hover {
          background: #00132d;
          color: #fff7d7;
          transform: translateY(-2px);
        }

        /* Camera Processing */
        .camera-processing {
          padding: 20px;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .image-preview {
          position: relative;
          margin-bottom: 20px;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        }

        .image-preview img {
          width: 100%;
          height: 300px;
          object-fit: cover;
        }

        .close-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          border: none;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          backdrop-filter: blur(10px);
        }

        .processing-state {
          text-align: center;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .processing-spinner {
          margin-bottom: 16px;
          color: #00132d;
        }

        .processing-state h3 {
          font-size: 20px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 8px 0;
        }

        .processing-state p {
          font-size: 14px;
          color: #6b7280;
          margin: 0 0 24px 0;
        }

        .processing-steps {
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: center;
        }

        .step {
          font-size: 12px;
          color: #9ca3af;
          padding: 4px 12px;
          border-radius: 12px;
          background: #f3f4f6;
          transition: all 0.3s;
        }

        .step.active {
          color: #00132d;
          background: #fff7d7;
          font-weight: 500;
        }

        .processing-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: auto;
        }

        .process-btn {
          background: linear-gradient(135deg, #00132d 0%, #001a3d 100%);
          color: #fff7d7;
          border: none;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .process-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(1, 19, 45, 0.3);
        }

        .cancel-btn {
          background: #f3f4f6;
          color: #374151;
          border: none;
          border-radius: 12px;
          padding: 12px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cancel-btn:hover {
          background: #e5e7eb;
        }

        /* Empty States */
        .empty-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          text-align: center;
        }

        .empty-state svg {
          margin-bottom: 16px;
        }

        .empty-state h3 {
          font-size: 20px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 8px 0;
        }

        .empty-state p {
          font-size: 14px;
          color: #6b7280;
          margin: 0 0 24px 0;
          line-height: 1.5;
        }

        .reset-btn, .primary-btn {
          background: #00132d;
          color: #fff7d7;
          border: none;
          border-radius: 12px;
          padding: 12px 20px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .reset-btn:hover, .primary-btn:hover {
          background: #001a3d;
          transform: translateY(-2px);
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(10px);
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .item-detail-modal {
          background: white;
          border-radius: 20px;
          width: 90%;
          max-width: 400px;
          max-height: 90vh;
          overflow: hidden;
          animation: slideUp 0.3s ease-out;
          box-shadow: 0 25px 50px rgba(0,0,0,0.3);
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(50px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .modal-header {
          position: relative;
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: #f3f4f6;
          border: none;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .modal-close:hover {
          background: #e5e7eb;
          transform: scale(1.1);
        }

        .modal-content {
          overflow-y: auto;
          max-height: calc(90vh - 80px);
        }

        .detail-image {
          position: relative;
        }

        .detail-image img {
          width: 100%;
          height: 300px;
          object-fit: cover;
        }

        .detail-favorite {
          position: absolute;
          top: 16px;
          right: 16px;
          background: rgba(255, 255, 255, 0.9);
          border: none;
          border-radius: 50%;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          backdrop-filter: blur(10px);
          transition: all 0.2s;
        }

        .detail-favorite:hover {
          background: white;
          transform: scale(1.1);
        }

        .detail-info {
          padding: 20px;
        }

        .detail-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .detail-header h2 {
          font-size: 22px;
          font-weight: 700;
          color: #111827;
          margin: 0;
          flex: 1;
        }

        .detail-rating {
          display: flex;
          gap: 2px;
          margin-left: 12px;
        }

        .detail-brand {
          font-size: 16px;
          color: #00132d;
          font-weight: 600;
          margin: 0 0 8px 0;
        }

        .detail-price {
          font-size: 24px;
          font-weight: 700;
          color: #10b981;
          margin: 0 0 20px 0;
        }

        .detail-specs {
          background: #f9fafb;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 20px;
        }

        .spec-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .spec-item:last-child {
          border-bottom: none;
        }

        .spec-item span:first-child {
          font-size: 14px;
          color: #6b7280;
          font-weight: 500;
        }

        .spec-item span:last-child {
          font-size: 14px;
          color: #111827;
          font-weight: 600;
        }

        .condition-text.new { color: #10b981; }
        .condition-text.excellent { color: #3b82f6; }
        .condition-text.good { color: #f59e0b; }
        .condition-text.fair { color: #f97316; }

        .detail-description {
          margin-bottom: 20px;
        }

        .detail-description h4 {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 8px 0;
        }

        .detail-description p {
          font-size: 14px;
          color: #6b7280;
          line-height: 1.6;
          margin: 0;
        }

        .detail-tags {
          margin-bottom: 24px;
        }

        .detail-tags h4 {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 12px 0;
        }

        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .detail-tag {
          background: #fff7d7;
          color: #00132d;
          font-size: 12px;
          font-weight: 500;
          padding: 6px 12px;
          border-radius: 16px;
        }

        .detail-actions {
          display: flex;
          gap: 12px;
        }

        .action-btn {
          flex: 1;
          border: none;
          border-radius: 12px;
          padding: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn.primary {
          background: #00132d;
          color: #fff7d7;
        }

        .action-btn.primary:hover {
          background: #001a3d;
          transform: translateY(-2px);
        }

        .action-btn.secondary {
          background: #f3f4f6;
          color: #374151;
        }

        .action-btn.secondary:hover {
          background: #e5e7eb;
          transform: translateY(-2px);
        }

        .hidden {
          display: none;
        }
      `}</style>
    </div>
  );
}