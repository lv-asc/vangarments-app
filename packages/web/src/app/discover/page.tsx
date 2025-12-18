'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { brandApi } from '@/lib/brandApi';
import { journalismApi, IJournalismData } from '@/lib/journalismApi';
import { apiClient } from '@/lib/api';
import {
  FireIcon,
  BuildingStorefrontIcon,
  NewspaperIcon,
  UsersIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { getImageUrl, debounce } from '@/lib/utils';
import { useRouter } from 'next/navigation';

type FilterType = 'all' | 'brand' | 'store' | 'story' | 'user';

export default function DiscoverPage() {
  const router = useRouter();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [isSearching, setIsSearching] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Data
  const [featuredBrands, setFeaturedBrands] = useState<any[]>([]);
  const [featuredStores, setFeaturedStores] = useState<any[]>([]);
  const [featuredStories, setFeaturedStories] = useState<IJournalismData[]>([]);

  // Search Results
  const [results, setResults] = useState<{
    brands: any[];
    stores: any[];
    stories: IJournalismData[];
    users: any[];
  }>({
    brands: [],
    stores: [],
    stories: [],
    users: []
  });

  // Initial Load - Featured Content
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoadingInitial(true);
      try {
        const [brandsRes, storesRes, journalismRes] = await Promise.all([
          brandApi.getBrands({ limit: 10, businessType: 'brand' }),
          brandApi.getBrands({ limit: 10, businessType: 'store' }),
          journalismApi.getAll({ published: true })
        ]);

        setFeaturedBrands(Array.isArray(brandsRes) ? brandsRes : (brandsRes as any).brands || []);
        setFeaturedStores(Array.isArray(storesRes) ? storesRes : (storesRes as any).brands || []);
        setFeaturedStories(Array.isArray(journalismRes) ? journalismRes : []);
      } catch (error) {
        console.error("Failed to load discover data", error);
      } finally {
        setLoadingInitial(false);
      }
    };

    fetchInitialData();
  }, []);

  // Search Logic
  const performSearch = useCallback(async (query: string, type: FilterType) => {
    if (!query.trim()) {
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      // Define promises based on filter type
      const promises: Promise<any>[] = [];

      const fetchBrands = type === 'all' || type === 'brand';
      const fetchStores = type === 'all' || type === 'store';
      const fetchStories = type === 'all' || type === 'story';
      const fetchUsers = type === 'all' || type === 'user';

      // Brands
      if (fetchBrands) promises.push(brandApi.getBrands({ search: query, businessType: 'brand', limit: 5 }));
      else promises.push(Promise.resolve([]));

      // Stores
      if (fetchStores) promises.push(brandApi.getBrands({ search: query, businessType: 'store', limit: 5 }));
      else promises.push(Promise.resolve([]));

      // Stories (Client side text filter for now as API might not support search param)
      if (fetchStories) promises.push(journalismApi.getAll({ published: true }).then((all: any) =>
        all.filter((item: IJournalismData) => item.title.toLowerCase().includes(query.toLowerCase()))
      ));
      else promises.push(Promise.resolve([]));

      // Users (Assuming basic user search endpoint or filtering)
      if (fetchUsers) {
        // Try to use a search endpoint, fallback to fetching recent users and filtering
        // We'll use a safer approach: generic GET /users with search param if API supports
        // If not, we might need to rely on what we have.
        promises.push(apiClient.get(`/users?search=${encodeURIComponent(query)}&limit=5`)
          .then((res: any) => res.users || res.data?.users || [])
          .catch(() => [])
        );
      } else promises.push(Promise.resolve([]));

      const [brandsRes, storesRes, storiesRes, usersRes] = await Promise.all(promises);

      setResults({
        brands: Array.isArray(brandsRes) ? brandsRes : (brandsRes as any).brands || [],
        stores: Array.isArray(storesRes) ? storesRes : (storesRes as any).brands || [],
        stories: storiesRes || [],
        users: usersRes || []
      });

    } catch (error) {
      console.error("Search failed", error);
    }
  }, []);

  // Debounced Search Handler
  const debouncedSearch = useCallback(debounce((q: string, t: FilterType) => performSearch(q, t), 500), [performSearch]);

  useEffect(() => {
    if (searchQuery) {
      debouncedSearch(searchQuery, filterType);
    } else {
      setIsSearching(false);
      setResults({ brands: [], stores: [], stories: [], users: [] });
    }
  }, [searchQuery, filterType, debouncedSearch]);

  // UI Components

  const SectionHeader = ({ title, icon: Icon, link }: { title: string, icon: any, link?: string }) => (
    <div className="flex items-center justify-between mb-4 px-4 sm:px-0 mt-8 first:mt-0">
      <div className="flex items-center space-x-2">
        <Icon className="h-6 w-6 text-gray-900" />
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      </div>
      {link && (
        <Link href={link} className="text-sm font-medium text-blue-600 hover:text-blue-500 flex items-center">
          See all <ArrowRightIcon className="h-4 w-4 ml-1" />
        </Link>
      )}
    </div>
  );

  const BrandCard = ({ brand }: { brand: any }) => {
    const businessType = brand.brandInfo?.businessType;
    const basePath = businessType === 'non_profit' ? 'non-profits' : 'brands';

    return (
      <Link href={`/${basePath}/${brand.brandInfo?.slug || brand.id}`} className="min-w-[160px] md:min-w-[200px] snap-start group cursor-pointer block">
        <div className="aspect-[4/3] rounded-lg bg-gray-100 overflow-hidden relative border border-gray-100 mb-3 shadow-sm group-hover:shadow-md transition-all">
          {brand.brandInfo?.logo ? (
            <img
              src={getImageUrl(brand.brandInfo.logo)}
              alt={brand.brandInfo.name}
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold text-3xl bg-gray-50">
              {brand.brandInfo?.name?.substring(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <h3 className="font-semibold text-gray-900 truncate px-1">{brand.brandInfo?.name}</h3>
        <p className="text-xs text-gray-500 px-1 truncate">{brand.brandInfo?.country || 'Global'}</p>
      </Link>
    );
  };

  const StoryCard = ({ story }: { story: IJournalismData }) => (
    <Link href={`/journalism/${story.id}`} className="min-w-[280px] md:min-w-[340px] snap-start group cursor-pointer relative rounded-xl overflow-hidden aspect-[16/10] block">
      {story.images?.[0]?.url ? (
        <img
          src={story.images[0].url}
          alt={story.title}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
        />
      ) : (
        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
          <NewspaperIcon className="h-12 w-12" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 flex flex-col justify-end">
        <span className="text-xs font-bold text-white/90 uppercase tracking-wider mb-1 bg-blue-600/80 px-2 py-0.5 rounded w-fit">{story.type}</span>
        <h3 className="text-lg font-bold text-white leading-tight group-hover:underline decoration-white/50 underline-offset-4">{story.title}</h3>
      </div>
    </Link>
  );

  const UserCard = ({ user }: { user: any }) => (
    <div className="flex items-center space-x-3 p-3 rounded-lg bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/profile/${user.id}`)}>
      <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
        {user.profilePicture ? (
          <img src={getImageUrl(user.profilePicture)} alt={user.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-gray-500 text-xs font-bold">
            {user.name?.substring(0, 2).toUpperCase()}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
        <p className="text-xs text-gray-500 truncate">@{user.username || user.name?.toLowerCase().replace(/\s/g, '')}</p>
      </div>
      {/* Can add follow button here later */}
    </div>
  );

  const ResultSection = ({ title, items, renderItem, icon: Icon }: { title: string, items: any[], renderItem: (item: any) => React.ReactNode, icon: any }) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="mb-8">
        <div className="flex items-center space-x-2 mb-4 px-4 sm:px-0">
          <Icon className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
        <div className={items[0]?.title ? "flex overflow-x-auto gap-4 pb-4 px-4 sm:px-0 scrollbar-hide snap-x" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-4 sm:px-0"}>
          {items.map((item) => (
            <div key={item.id} className="min-w-0">
              {renderItem(item)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Search Header */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-20 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search brands, stores, editorial, people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-100 border-none rounded-full py-3 pl-12 pr-10 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>
          {/* Filters */}
          <div className="flex items-center space-x-2 mt-4 overflow-x-auto scrollbar-hide pb-1">
            {[
              { id: 'all', label: 'All' },
              { id: 'brand', label: 'Brands' },
              { id: 'store', label: 'Stores' },
              { id: 'story', label: 'Stories' },
              { id: 'user', label: 'People' }
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setFilterType(filter.id as FilterType)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filterType === filter.id
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-8">
        {isSearching ? (
          <div className="space-y-8 animate-fadeIn">
            {filterType === 'all' && Object.values(results).every(arr => arr.length === 0) ? (
              <div className="text-center py-20 text-gray-500">
                <MagnifyingGlassIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p>No results found for "{searchQuery}"</p>
              </div>
            ) : (
              <>
                {(filterType === 'all' || filterType === 'brand') && (
                  <ResultSection title="Brands" items={results.brands} icon={FireIcon} renderItem={item => <BrandCard brand={item} />} />
                )}
                {(filterType === 'all' || filterType === 'store') && (
                  <ResultSection title="Stores" items={results.stores} icon={BuildingStorefrontIcon} renderItem={item => <BrandCard brand={item} />} />
                )}
                {(filterType === 'all' || filterType === 'story') && (
                  <ResultSection title="Stories" items={results.stories} icon={NewspaperIcon} renderItem={item => <StoryCard story={item} />} />
                )}
                {(filterType === 'all' || filterType === 'user') && (
                  <ResultSection title="People" items={results.users} icon={UsersIcon} renderItem={item => <UserCard user={item} />} />
                )}
              </>
            )}
          </div>
        ) : (
          <div className="space-y-12">
            {/* Default / Featured View */}

            {/* Hero Story */}
            {featuredStories.length > 0 && (
              <section className="px-4 sm:px-6 lg:px-8">
                <Link href={`/journalism/${featuredStories[0].id}`} className="block relative rounded-2xl overflow-hidden bg-gray-900 aspect-[2/1] sm:aspect-[2.5/1] shadow-xl group cursor-pointer ring-1 ring-black/5 hover:ring-black/10 transition-all">
                  {featuredStories[0].images?.[0]?.url && (
                    <img src={featuredStories[0].images[0].url} className="w-full h-full object-cover opacity-60 group-hover:opacity-50 transition-opacity duration-700" alt="Hero" />
                  )}
                  <div className="absolute inset-0 flex flex-col justify-center items-start p-8 sm:p-12">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm mb-4 border border-white/30">
                      Featured Story
                    </span>
                    <h1 className="text-2xl sm:text-5xl font-extrabold text-white mb-4 max-w-3xl leading-tight drop-shadow-sm">
                      {featuredStories[0].title}
                    </h1>
                    <div className="flex items-center text-white/90 font-medium group-hover:translate-x-1 transition-transform">
                      Read Article <ArrowRightIcon className="h-4 w-4 ml-2" />
                    </div>
                  </div>
                </Link>
              </section>
            )}

            {featuredBrands.length > 0 && (
              <section className="sm:px-6 lg:px-8">
                <SectionHeader title="Trending Brands" icon={FireIcon} link="/brands" />
                <div className="flex overflow-x-auto gap-4 pb-4 px-4 sm:px-0 snap-x scrollbar-hide">
                  {featuredBrands.map((brand: any) => (
                    <BrandCard key={brand.id} brand={brand} />
                  ))}
                </div>
              </section>
            )}

            {featuredStores.length > 0 && (
              <section className="sm:px-6 lg:px-8">
                <SectionHeader title="Design Stores" icon={BuildingStorefrontIcon} link="/stores" />
                <div className="flex overflow-x-auto gap-4 pb-4 px-4 sm:px-0 snap-x scrollbar-hide">
                  {featuredStores.map((store: any) => (
                    <BrandCard key={store.id} brand={store} />
                  ))}
                </div>
              </section>
            )}

            {!loadingInitial && featuredBrands.length === 0 && featuredStores.length === 0 && (
              <div className="text-center py-20 text-gray-400">
                <p>Start searching to discover content.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}