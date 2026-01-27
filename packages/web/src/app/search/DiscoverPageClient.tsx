'use client';

import SKUCard from '@/components/ui/SKUCard';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { brandApi } from '@/lib/brandApi';
import { journalismApi, IJournalismData } from '@/lib/journalismApi';
import { apiClient } from '@/lib/api';
import { WardrobeAPI, WardrobeItem } from '@/lib/wardrobeApi';
import { skuApi } from '@/lib/skuApi';
import { pageApi, IPage } from '@/lib/pageApi';
import { socialApi } from '@/lib/socialApi';
import {
  FireIcon,
  BuildingStorefrontIcon,
  NewspaperIcon,
  UsersIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ShoppingBagIcon,
  DocumentTextIcon,
  RectangleStackIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  HeartIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import { getImageUrl, debounce } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRecentVisits } from '@/hooks/useRecentVisits';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';

type FilterType = 'all' | 'item' | 'brand' | 'store' | 'user' | 'post' | 'page' | 'non_profit' | 'supplier' | 'editorial' | 'event';

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

// UI Components (Helpers)

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
    <Link href={`/${basePath}/${brand.brandInfo?.slug || brand.id}`} className="w-[160px] md:w-[200px] flex-none snap-start group cursor-pointer block">
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
      <div className="flex items-center gap-1 px-1 min-w-0">
        <h3 className="font-semibold text-gray-900 truncate min-w-0">{brand.brandInfo?.name}</h3>
        {(brand.brandInfo?.verificationStatus === 'verified' || brand.verificationStatus === 'verified') && (
          <VerifiedBadge size="sm" className="flex-shrink-0" />
        )}
      </div>
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
  <Link href={`/u/${user.username || user.name?.toLowerCase().replace(/\s/g, '')}`} className="flex items-center space-x-3 p-3 rounded-lg bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer block">
    <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
      {user.personalInfo?.avatarUrl ? (
        <img src={getImageUrl(user.personalInfo.avatarUrl)} alt={user.name || user.personalInfo?.name} className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full flex items-center justify-center text-gray-500 text-xs font-bold">
          {(user.name || user.personalInfo?.name || '').substring(0, 2).toUpperCase()}
        </div>
      )}
    </div>
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate min-w-0">{user.name}</p>
        {(user.verificationStatus === 'verified' || user.isVerified === true) && (
          <VerifiedBadge size="sm" className="flex-shrink-0" />
        )}
      </div>
      <p className="text-xs text-gray-500 truncate">@{user.username || user.name?.toLowerCase().replace(/\s/g, '')}</p>
    </div>
  </Link>
);

const VerticalUserCard = ({ user }: { user: any }) => (
  <Link href={`/u/${user.username}`} className="w-[160px] md:w-[200px] flex-none snap-start group cursor-pointer block">
    <div className="aspect-[4/3] rounded-lg bg-gray-100 overflow-hidden relative border border-gray-100 mb-3 shadow-sm group-hover:shadow-md transition-all">
      {user.personalInfo?.avatarUrl ? (
        <img src={getImageUrl(user.personalInfo.avatarUrl)} alt={user.name} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold text-3xl bg-gray-50">
          {(user.name || '').substring(0, 2).toUpperCase()}
        </div>
      )}
    </div>
    <div className="flex items-center gap-1 px-1 min-w-0">
      <h3 className="font-semibold text-gray-900 truncate min-w-0">{user.name}</h3>
      {(user.verificationStatus === 'verified' || user.isVerified === true) && (
        <VerifiedBadge size="sm" className="flex-shrink-0" />
      )}
    </div>
    <p className="text-xs text-gray-500 px-1 truncate">@{user.username}</p>
  </Link>
);

const EventCard = ({ event }: { event: any }) => (
  <Link href={`/events/${event.slug}`} className="block bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group">
    <div className="h-24 bg-gray-50 relative overflow-hidden">
      {event.banner ? (
        <img src={event.banner} alt={event.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-200">
          <CalendarDaysIcon className="h-10 w-10" />
        </div>
      )}
      <div className="absolute top-2 right-2">
        <span className="px-2 py-0.5 bg-white/90 backdrop-blur-sm text-gray-900 text-[9px] font-black uppercase tracking-widest rounded-full shadow-sm">
          {event.eventType?.replace(/_/g, ' ') || 'Event'}
        </span>
      </div>
    </div>
    <div className="p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-8 w-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
          {event.masterLogo ? (
            <img src={event.masterLogo} alt={event.name} className="h-full w-full object-contain p-1" />
          ) : (
            <CalendarDaysIcon className="h-4 w-4 text-gray-300" />
          )}
        </div>
        <h2 className="font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors uppercase italic text-sm">{event.name}</h2>
      </div>
      <div className="flex items-center gap-1.5 text-[10px] text-gray-500 uppercase font-bold tracking-wider">
        <span>{new Date(event.startDate).toLocaleDateString()}</span>
        {event.venueCity && (
          <>
            <span className="text-gray-300">•</span>
            <span className="truncate">{event.venueCity}</span>
          </>
        )}
      </div>
    </div>
  </Link>
);

const VerticalPageCard = ({ page }: { page: any }) => (
  <Link href={`/pages/${page.slug || page.id}`} className="w-[160px] md:w-[200px] flex-none snap-start group cursor-pointer block">
    <div className="aspect-[4/3] rounded-lg bg-gray-100 overflow-hidden relative border border-gray-100 mb-3 shadow-sm group-hover:shadow-md transition-all">
      {page.logoUrl ? (
        <img
          src={getImageUrl(page.logoUrl)}
          alt={page.name}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold text-3xl bg-gray-50">
          {page.name?.substring(0, 2).toUpperCase()}
        </div>
      )}
    </div>
    <div className="flex items-center gap-1 px-1 min-w-0">
      <h3 className="font-semibold text-gray-900 truncate min-w-0">{page.name}</h3>
      {(page.verificationStatus === 'verified' || page.isVerified === true) && (
        <VerifiedBadge size="sm" className="flex-shrink-0" />
      )}
    </div>
    <p className="text-xs text-gray-500 px-1 truncate">Page</p>
  </Link>
);

const VerticalSKUCard = ({ item }: { item: any }) => {
  const brandName = item.brand?.name || item.brand?.brand || 'Unknown';
  const brandSlug = item.brand?.slug || (item.brand?.name ? item.brand.name.toLowerCase().replace(/\s+/g, '-') : 'brand');
  const productSlug = item.code ? item.code.toLowerCase().replace(/\s+/g, '-') : item.slug || (item.name ? item.name.toLowerCase().replace(/\s+/g, '-') : 'item');
  const imageUrl = item.images?.[0]?.url || item.images?.[0]?.imageUrl || item.logo;
  const productUrl = `/items/${productSlug}`;

  // Strip size suffix from display name
  const displayName = item.name?.replace(/\s*\[(X{0,3}S|X{0,4}L|M|[0-9]+)\]\s*$/i, '').trim() || item.name;

  const slugify = (text: string) => text.toString().toLowerCase()
    .replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-').replace(/^-+/, '').replace(/-+$/, '');

  return (
    <div className="w-[160px] md:w-[200px] flex-none snap-start group block">
      <Link href={productUrl} className="block aspect-[4/3] rounded-lg bg-gray-100 overflow-hidden relative border border-gray-100 mb-3 shadow-sm group-hover:shadow-md transition-all">
        {imageUrl ? (
          <img src={getImageUrl(imageUrl)} alt={displayName} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <ShoppingBagIcon className="h-12 w-12" />
          </div>
        )}
      </Link>
      <div className="px-1">
        {/* Badges Row */}
        <div className="flex flex-wrap items-center gap-1.5 mb-1">
          <Link href={`/brands/${brandSlug}`} className="flex items-center gap-1 hover:opacity-80 transition-opacity min-w-0">
            <div className="h-3 w-3 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
              {item.brand?.logo ? <img src={getImageUrl(item.brand.logo)} className="h-full w-full object-contain" /> : <div className="h-full w-full flex items-center justify-center text-[6px] font-bold text-gray-400">{brandName.charAt(0)}</div>}
            </div>
            <span className="text-[10px] font-bold text-gray-900 truncate">{brandName}</span>
          </Link>
          {(item.lineInfo || item.line) && (
            <Link href={`/brands/${brandSlug}?line=${item.lineId || item.lineInfo?.id || slugify(item.lineInfo?.name || item.line)}`} className="flex items-center gap-0.5 hover:opacity-80 transition-opacity min-w-0">
              <div className="h-3 w-3 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                {item.lineInfo?.logo ? <img src={getImageUrl(item.lineInfo.logo)} className="h-full w-full object-contain" /> : <div className="h-full w-full flex items-center justify-center text-[6px] font-bold text-gray-400">L</div>}
              </div>
              <span className="text-[9px] text-gray-500 truncate max-w-[50px]">{item.lineInfo?.name || item.line}</span>
            </Link>
          )}
          {(item.collectionInfo?.name || item.collection) && (
            <Link href={`/brands/${brandSlug}/collections/${slugify(item.collectionInfo?.name || item.collection)}`} className="flex items-center gap-0.5 hover:opacity-80 transition-opacity min-w-0">
              <div className="h-3 w-3 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                {item.collectionInfo?.coverImage ? <img src={getImageUrl(item.collectionInfo.coverImage)} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-[6px] font-bold text-gray-400">C</div>}
              </div>
              <span className="text-[9px] text-gray-500 truncate max-w-[50px]">{item.collectionInfo?.name || item.collection}</span>
            </Link>
          )}
        </div>
        <Link href={productUrl}>
          <p className="text-xs text-gray-500 truncate hover:text-blue-600">{displayName}</p>
        </Link>
      </div>
    </div>
  );
};

const RecentCard = ({ item }: { item: any }) => {
  // Brand / Store / Non-Profit / Supplier
  if (['brand', 'store', 'supplier', 'non_profit'].includes(item.type) || item.businessType === 'brand' || item.businessType === 'store') {
    return <BrandCard brand={{ brandInfo: { ...item, logo: item.logo }, id: item.id, verificationStatus: item.verificationStatus }} />;
  }
  // User - use UserCard (same as Users filter)
  if (item.type === 'user' || item.businessType === 'user') {
    return <UserCard user={{ ...item, personalInfo: { avatarUrl: item.logo }, name: item.name, username: item.username, verificationStatus: item.verificationStatus }} />;
  }
  // Page
  if (item.type === 'page' || item.businessType === 'page') {
    return <PageCard page={{ ...item, logoUrl: item.logo }} />;
  }
  // Editorial (Journalism)
  if (item.type === 'editorial' || item.businessType === 'editorial') {
    return <StoryCard story={{ ...item, image: item.logo } as any} />;
  }
  // Item (Product) - use SKUCard (same as Items filter)
  if (item.type === 'item') {
    return (
      <SKUCard
        item={{
          ...item,
          name: item.name,
          code: item.slug,
          images: [{ url: item.logo }],
          brand: {
            name: item.brandName,
            slug: item.brandSlug
          }
        }}
      />
    );
  }

  return null;
};

const PostCard = ({ post }: { post: any }) => (
  <Link href={`/social/post/${post.id}`} className="block p-3 rounded-lg bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center gap-3">
      <div className="h-14 w-14 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
        {post.images?.[0] ? (
          <img src={getImageUrl(post.images[0])} alt="Post" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-gray-400">
            <ChatBubbleLeftRightIcon className="h-6 w-6" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 truncate">{post.caption || 'Untitled Post'}</p>
        <p className="text-xs text-gray-500 truncate">@{post.author?.username || 'user'}</p>
      </div>
    </div>
  </Link>
);

const PageCard = ({ page }: { page: IPage }) => (
  <Link href={`/pages/${page.slug || page.id}`} className="block p-3 rounded-lg bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center gap-3">
      <div className="h-12 w-12 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
        {page.logoUrl ? (
          <img src={getImageUrl(page.logoUrl)} alt={page.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-gray-400 font-bold text-xs">
            {page.name.substring(0, 2).toUpperCase()}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <p className="text-sm font-semibold text-gray-900 truncate">{page.name}</p>
          {(page.verificationStatus === 'verified' || (page as any).isVerified) && <VerifiedBadge size="sm" />}
        </div>
        {page.description && <p className="text-xs text-gray-500 truncate">{page.description}</p>}
      </div>
    </div>
  </Link>
);

export default function DiscoverPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as FilterType) || 'all';
  const { recents } = useRecentVisits();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>(initialTab);

  // Sync with URL
  useEffect(() => {
    const tab = searchParams.get('tab') as FilterType;
    if (tab && tab !== filterType) {
      setFilterType(tab);
    }
  }, [searchParams]);

  const handleFilterChange = (type: FilterType) => {
    setFilterType(type);
    const params = new URLSearchParams(searchParams.toString());
    if (type === 'all') {
      params.delete('tab');
    } else {
      params.set('tab', type);
    }
    router.replace(`/search?${params.toString()}`, { scroll: false });
  };
  const [isSearching, setIsSearching] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Data
  const [featuredBrands, setFeaturedBrands] = useState<any[]>([]);
  const [featuredStores, setFeaturedStores] = useState<any[]>([]);
  const [featuredUsers, setFeaturedUsers] = useState<any[]>([]);
  const [featuredItems, setFeaturedItems] = useState<any[]>([]);
  const [featuredNonProfits, setFeaturedNonProfits] = useState<any[]>([]);
  const [featuredStories, setFeaturedStories] = useState<IJournalismData[]>([]);
  const [featuredPages, setFeaturedPages] = useState<IPage[]>([]);

  // Search Results
  const [results, setResults] = useState<{
    brands: any[];
    stores: any[];
    suppliers: any[];
    nonProfits: any[];
    users: any[];
    items: WardrobeItem[];
    posts: any[];
    pages: IPage[];
    editorial: IJournalismData[];
    events: any[];
  }>({
    brands: [],
    stores: [],
    suppliers: [],
    nonProfits: [],
    users: [],
    items: [],
    posts: [],
    pages: [],
    editorial: [],
    events: []
  });

  // Initial Load - Featured Content
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoadingInitial(true);
      try {
        const [brandsRes, storesRes, usersRes, itemsRes, nonProfitsRes, journalismRes, pagesRes] = await Promise.all([
          brandApi.getBrands({ limit: 10, businessType: 'brand' }),
          brandApi.getBrands({ limit: 10, businessType: 'store' }),
          apiClient.get('/users?limit=10').then((res: any) => res.users || res.data?.users || []),
          skuApi.getAllSKUs({ limit: 10 }).then(res => res.skus || []),
          brandApi.getBrands({ limit: 10, businessType: 'non_profit' }),
          journalismApi.getAll({ published: true }),
          pageApi.getAll().then(res => Array.isArray(res) ? res.slice(0, 10) : []).catch(() => [])
        ]);

        setFeaturedBrands(Array.isArray(brandsRes) ? brandsRes : (brandsRes as any).brands || []);
        setFeaturedStores(Array.isArray(storesRes) ? storesRes : (storesRes as any).brands || []);
        setFeaturedUsers(usersRes || []);
        setFeaturedItems(itemsRes || []);
        setFeaturedNonProfits(Array.isArray(nonProfitsRes) ? nonProfitsRes : (nonProfitsRes as any).brands || []);
        setFeaturedStories(Array.isArray(journalismRes) ? journalismRes : []);
        setFeaturedPages(pagesRes || []);
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
    // If no query and filter is 'all', show default view
    if (!query.trim() && type === 'all') {
      setIsSearching(false);
      return;
    }

    // If filter is selected (not 'all'), fetch results even without query
    setIsSearching(true);
    try {
      // Define promises based on filter type
      const promises: Promise<any>[] = [];

      const fetchBrands = type === 'all' || type === 'brand';
      const fetchStores = type === 'all' || type === 'store';
      const fetchSuppliers = type === 'all' || type === 'supplier';
      const fetchNonProfits = type === 'all' || type === 'non_profit';
      const fetchUsers = type === 'all' || type === 'user';
      const fetchItems = type === 'all' || type === 'item';
      const fetchPosts = type === 'all' || type === 'post';
      const fetchPages = type === 'all' || type === 'page';
      const fetchEditorial = type === 'all' || type === 'editorial';
      const fetchEvents = type === 'all' || type === 'event';

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      // Brands
      if (fetchBrands) promises.push(brandApi.getBrands({ search: query || undefined, businessType: 'brand', limit: query ? 5 : 20 }));
      else promises.push(Promise.resolve([]));

      // Stores
      if (fetchStores) promises.push(brandApi.getBrands({ search: query || undefined, businessType: 'store', limit: query ? 5 : 20 }));
      else promises.push(Promise.resolve([]));

      // Suppliers
      if (fetchSuppliers) promises.push(brandApi.getBrands({ search: query || undefined, businessType: 'supplier', limit: query ? 5 : 20 }));
      else promises.push(Promise.resolve([]));

      // Non-Profits
      if (fetchNonProfits) promises.push(brandApi.getBrands({ search: query || undefined, businessType: 'non_profit', limit: query ? 5 : 20 }));
      else promises.push(Promise.resolve([]));

      // Users
      if (fetchUsers) {
        const userLimit = query ? 5 : 20;
        const userSearchParam = query ? `search=${encodeURIComponent(query)}&` : '';
        promises.push(apiClient.get(`/users?${userSearchParam}limit=${userLimit}`)
          .then((res: any) => res.users || res.data?.users || [])
          .catch(() => [])
        );
      } else promises.push(Promise.resolve([]));

      // Items (Official SKUs only - no wardrobe items)
      if (fetchItems) {
        const itemLimit = query ? 5 : 20;
        const skuPromise = query
          ? skuApi.searchSKUs(query).then(res => res.skus || []).catch(() => [])
          : skuApi.getAllSKUs({ limit: itemLimit }).then(res => res.skus || []).catch(() => []);

        promises.push(skuPromise);
      } else promises.push(Promise.resolve([]));

      // Posts (Social)
      if (fetchPosts) {
        const postLimit = query ? 5 : 20;
        promises.push(socialApi.searchPosts({ q: query || undefined, limit: postLimit })
          .then((res: any) => res.posts || [])
          .catch(() => [])
        );
      } else promises.push(Promise.resolve([]));

      // Pages
      if (fetchPages) {
        const pageLimit = query ? 5 : 20;
        promises.push(pageApi.getAll()
          .then((res: any) => {
            const pages = Array.isArray(res) ? res : res.pages || [];
            if (query) {
              return pages.filter((p: any) => p.name.toLowerCase().includes(query.toLowerCase())).slice(0, pageLimit);
            }
            return pages.slice(0, pageLimit);
          })
          .catch(() => [])
        );
      } else promises.push(Promise.resolve([]));

      // Editorial (Articles, Columns, News)
      if (fetchEditorial) {
        const editorialLimit = query ? 5 : 20;
        promises.push(journalismApi.getAll({ published: true })
          .then((items: IJournalismData[]) => {
            if (query) {
              return items.filter(i => i.title.toLowerCase().includes(query.toLowerCase())).slice(0, editorialLimit);
            }
            return items.slice(0, editorialLimit);
          })
          .catch(() => [])
        );
      } else promises.push(Promise.resolve([]));

      // Events
      if (fetchEvents) {
        const eventLimit = query ? 5 : 20;
        const eventSearchUrl = query ? `${API_URL}/api/events?search=${encodeURIComponent(query)}` : `${API_URL}/api/events`;
        promises.push(fetch(eventSearchUrl)
          .then(res => res.json())
          .catch(() => [])
        );
      } else promises.push(Promise.resolve([]));

      const [brandsRes, storesRes, suppliersRes, nonProfitsRes, usersRes, itemsRes, postsRes, pagesRes, editorialRes, eventsRes] = await Promise.all(promises);

      setResults({
        brands: Array.isArray(brandsRes) ? brandsRes : (brandsRes as any).brands || [],
        stores: Array.isArray(storesRes) ? storesRes : (storesRes as any).brands || [],
        suppliers: Array.isArray(suppliersRes) ? suppliersRes : (suppliersRes as any).brands || [],
        nonProfits: Array.isArray(nonProfitsRes) ? nonProfitsRes : (nonProfitsRes as any).brands || [],
        users: usersRes || [],
        items: itemsRes || [],
        posts: postsRes || [],
        pages: pagesRes || [],
        editorial: editorialRes || [],
        events: eventsRes || []
      });

    } catch (error) {
      console.error("Search failed", error);
    }
  }, []);

  // Debounced Search Handler
  const debouncedSearch = useCallback(debounce((q: string, t: FilterType) => performSearch(q, t), 500), [performSearch]);

  useEffect(() => {
    if (searchQuery) {
      // If there's a search query, use debounced search
      debouncedSearch(searchQuery, filterType);
    } else if (filterType !== 'all') {
      // If no query but a specific filter is selected, immediately fetch results
      performSearch('', filterType);
    } else {
      // No query and filter is 'all' - show default featured view
      setIsSearching(false);
      setResults({ brands: [], stores: [], suppliers: [], nonProfits: [], users: [], items: [], posts: [], pages: [], editorial: [], events: [] });
    }
  }, [searchQuery, filterType, debouncedSearch, performSearch]);








  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Search Header */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-20 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search items, brands, stores, people..."
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
              { id: 'item', label: 'Items' },
              { id: 'brand', label: 'Brands' },
              { id: 'store', label: 'Stores' },
              { id: 'user', label: 'Users' },
              { id: 'post', label: 'Posts' },
              { id: 'page', label: 'Pages' },
              { id: 'non_profit', label: 'Non-Profits' },
              { id: 'supplier', label: 'Suppliers' },
              { id: 'editorial', label: 'Editorial' },
              { id: 'event', label: 'Events' }
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => handleFilterChange(filter.id as FilterType)}
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
                {(filterType === 'all' || filterType === 'item') && (
                  <ResultSection title="Items" items={results.items} icon={ShoppingBagIcon} renderItem={item => <SKUCard item={item} />} />
                )}
                {(filterType === 'all' || filterType === 'brand') && (
                  <ResultSection title="Brands" items={results.brands} icon={FireIcon} renderItem={item => <BrandCard brand={item} />} />
                )}
                {(filterType === 'all' || filterType === 'store') && (
                  <ResultSection title="Stores" items={results.stores} icon={BuildingStorefrontIcon} renderItem={item => <BrandCard brand={item} />} />
                )}
                {(filterType === 'all' || filterType === 'user') && (
                  <ResultSection title="Users" items={results.users} icon={UsersIcon} renderItem={item => <UserCard user={item} />} />
                )}
                {(filterType === 'all' || filterType === 'post') && (
                  <ResultSection title="Posts" items={results.posts} icon={ChatBubbleLeftRightIcon} renderItem={item => <PostCard post={item} />} />
                )}
                {(filterType === 'all' || filterType === 'page') && (
                  <ResultSection title="Pages" items={results.pages} icon={RectangleStackIcon} renderItem={item => <PageCard page={item} />} />
                )}
                {(filterType === 'all' || filterType === 'non_profit') && (
                  <ResultSection title="Non-Profits" items={results.nonProfits} icon={HeartIcon} renderItem={item => <BrandCard brand={item} />} />
                )}
                {(filterType === 'all' || filterType === 'supplier') && (
                  <ResultSection title="Suppliers" items={results.suppliers} icon={BuildingStorefrontIcon} renderItem={item => <BrandCard brand={item} />} />
                )}
                {(filterType === 'all' || filterType === 'editorial') && (
                  <ResultSection title="Editorial" items={results.editorial} icon={NewspaperIcon} renderItem={item => <StoryCard story={item} />} />
                )}
                {(filterType === 'all' || filterType === 'event') && (
                  <ResultSection title="Events" items={results.events} icon={CalendarDaysIcon} renderItem={item => <EventCard event={item} />} />
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

            {recents.length > 0 && (
              <section className="sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-4 px-4 sm:px-0 mt-8 first:mt-0">
                  <div className="flex items-center space-x-2">
                    <ClockIcon className="h-6 w-6 text-gray-900" />
                    <h2 className="text-xl font-bold text-gray-900">Recently Viewed</h2>
                  </div>
                </div>
                <div className="flex overflow-x-auto gap-4 pb-4 px-4 sm:px-0 snap-x scrollbar-hide">
                  {recents.map((recent) => (
                    <div key={recent.id + recent.visitedAt} className="min-w-[280px] sm:min-w-[320px] flex-none snap-start">
                      <RecentCard item={recent} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {featuredStores.length > 0 && (
              <section className="sm:px-6 lg:px-8">
                <SectionHeader title="Stores" icon={BuildingStorefrontIcon} link="/stores" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-4 sm:px-0">
                  {featuredStores.map((store: any) => (
                    <BrandCard key={store.id} brand={store} />
                  ))}
                </div>
              </section>
            )}

            {featuredBrands.length > 0 && (
              <section className="sm:px-6 lg:px-8">
                <SectionHeader title="Brands" icon={FireIcon} link="/brands" />
                <div className="flex overflow-x-auto gap-4 pb-4 px-4 sm:px-0 snap-x scrollbar-hide">
                  {featuredBrands.map((brand: any) => (
                    <BrandCard key={brand.id} brand={brand} />
                  ))}
                </div>
              </section>
            )}

            {featuredUsers.length > 0 && (
              <section className="sm:px-6 lg:px-8">
                <SectionHeader title="Users" icon={UsersIcon} />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-4 sm:px-0">
                  {featuredUsers.map((user: any) => (
                    <UserCard key={user.id} user={user} />
                  ))}
                </div>
              </section>
            )}

            {featuredPages.length > 0 && (
              <section className="sm:px-6 lg:px-8">
                <SectionHeader title="Pages" icon={RectangleStackIcon} />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-4 sm:px-0">
                  {featuredPages.map((page: any) => (
                    <PageCard key={page.id} page={page} />
                  ))}
                </div>
              </section>
            )}

            {featuredNonProfits.length > 0 && (
              <section className="sm:px-6 lg:px-8">
                <SectionHeader title="Non-Profits" icon={UsersIcon} />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-4 sm:px-0">
                  {featuredNonProfits.map((np: any) => (
                    <BrandCard key={np.id} brand={np} />
                  ))}
                </div>
              </section>
            )}

            {featuredItems.length > 0 && (
              <section className="sm:px-6 lg:px-8">
                <SectionHeader title="Items" icon={ShoppingBagIcon} />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-4 sm:px-0">
                  {featuredItems.map((item: any) => (
                    <SKUCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            )}

            {!loadingInitial && featuredBrands.length === 0 && featuredStores.length === 0 && featuredUsers.length === 0 && featuredNonProfits.length === 0 && featuredItems.length === 0 && featuredPages.length === 0 && (
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