// @ts-nocheck
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { useAuth, ActiveAccount } from '@/contexts/AuthWrapper';
import { apiClient } from '@/lib/api';
import { getImageUrl } from '@/utils/imageUrl';
import { useToast } from '@/components/ui/Toast';
import { formatCEP, formatPhone } from '@/lib/masks';
import { SocialIcon } from '@/components/ui/social-icons';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import {
  CameraIcon,
  PencilIcon,
  CogIcon,
  UserIcon,
  MapPinIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  ArrowRightOnRectangleIcon,
  BuildingStorefrontIcon,
  SparklesIcon,
  DocumentTextIcon,
  TruckIcon,
  NewspaperIcon
} from '@heroicons/react/24/outline';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { BRAZILIAN_STATES } from '../../constants/address';
import ImageCropper from '@/components/ui/ImageCropper';
import { SortableImageGrid } from '@/components/profile/SortableImageGrid';
import { AVAILABLE_ROLES } from '@/constants/roles';
import { MeasurementsSection } from '@/components/profile/MeasurementsSection';
import { MeasurementManager } from '@/components/profile/MeasurementManager';
import VerificationRequestModal from '@/components/verification/VerificationRequestModal';
import SwitchAccountModal from '@/components/profile/SwitchAccountModal';
import { LikedItemsTab } from '@/components/profile/LikedItemsTab';
import { WishlistTab } from '@/components/profile/WishlistTab';
import { WardrobeItemCard } from '@/components/wardrobe/WardrobeItemCard';
import { Switch } from '@/components/ui/Switch';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Bars3Icon } from '@heroicons/react/24/outline';

interface UserProfile {
  id: string;
  name: string;
  username: string;
  verificationStatus?: string;
  usernameLastChanged?: string;
  email: string;
  bio?: string;
  profileImage?: string;
  bannerImage?: string;
  profileImages?: string[]; // Array of up to 5 profile images
  bannerImages?: string[]; // Array of up to 5 banner images for slideshow
  cpf?: string;
  birthDate?: string;
  socialLinks?: { platform: string; url: string }[];
  privacySettings?: {
    height: boolean;
    weight: boolean;
    birthDate: boolean;
    country?: boolean;
    state?: boolean;
    city?: boolean;
    likedItems?: boolean;
    wishlists?: boolean;
  };
  roles?: string[];
  createdAt: string;
  stats: {
    wardrobeItems: number;
    outfitsCreated: number;
    followers: number;
    following: number;
    pendingFollowRequests?: number;
  };
  preferences?: {
    style: string[];
    brands: string[];
    colors: string[];
    priceRange: {
      min: number;
      max: number;
    };
  };
}

const SOCIAL_PLATFORMS = [
  'Website', 'X (Twitter)', 'Discord', 'Instagram', 'YouTube', 'Snapchat', 'Pinterest', 'TikTok',
  'Facebook', 'Spotify', 'Apple Music', 'YouTube Music'
];
const MULTI_ENTRY_PLATFORMS = ['Website'];
const MAX_MULTI_ENTRIES = 5;

// Generate unique ID for social links
const generateSocialLinkId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Sortable Social Link Item Component
interface SortableSocialLinkItemProps {
  id: string;
  platform: string;
  url: string;
  index?: number; // For displaying "Website 2", "Website 3", etc.
  onChange: (url: string) => void;
  onRemove: () => void;
  isDragging?: boolean;
}

function SortableSocialLinkItem({ id, platform, url, index, onChange, onRemove, isDragging }: SortableSocialLinkItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const displayName = index && index > 1 ? `${platform} ${index}` : platform;

  // Extract favicon URL for Website platform
  const getFaviconUrl = (websiteUrl: string) => {
    try {
      const urlObj = new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`);
      return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
    } catch {
      return null;
    }
  };

  const faviconUrl = platform === 'Website' && url ? getFaviconUrl(url) : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center space-x-2 group"
    >
      {/* Drag Handle */}
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
        {...attributes}
        {...listeners}
      >
        <Bars3Icon className="h-5 w-5" />
      </button>

      <div className="w-28 flex items-center space-x-2">
        {faviconUrl ? (
          <img
            src={faviconUrl}
            alt=""
            className="h-4 w-4 rounded-sm"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <SocialIcon
          platform={platform}
          size="sm"
          className={`text-gray-400 ${faviconUrl ? 'hidden' : ''}`}
        />
        <span className="text-sm text-gray-600">{displayName}</span>
      </div>
      <input
        type="text"
        value={url}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 text-sm border-gray-200 rounded-md focus:border-[#00132d] focus:ring-[#00132d]"
        placeholder={`Your ${platform} URL`}
      />
      <button
        type="button"
        onClick={onRemove}
        className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}


// WardrobeTabContent component - matches the main wardrobe page styling
function WardrobeTabContent({ wardrobeItems, wardrobeLoading }: { wardrobeItems: any[], wardrobeLoading: boolean }) {
  const router = useRouter();

  // Initialize from localStorage, default to false (show No BG) - Synced with WardrobeManagement
  const [showOriginalBackgrounds, setShowOriginalBackgrounds] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('wardrobe-show-original-bg');
      return saved === 'true';
    }
    return false;
  });

  // Sync to localStorage when changed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('wardrobe-show-original-bg', String(showOriginalBackgrounds));
    }
  }, [showOriginalBackgrounds]);

  // Image processing logic to match WardrobeManagement.tsx
  const isProcessed = (img: any) => img.type === 'background_removed' || img.imageType === 'background_removed';

  const processItemImages = (item: any) => {
    // Sort all images by sortOrder first
    const sortedImages = [...(item.images || [])].sort((a: any, b: any) =>
      (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    );

    // Get originals in sort order
    const originalImages = sortedImages.filter((img: any) => !isProcessed(img));

    // Build image list for card
    let cardImages: any[];
    if (!showOriginalBackgrounds) {
      // No BG mode: for each original, prefer its No BG version if available
      cardImages = originalImages.map(orig => {
        const noBgVersion = sortedImages.find((img: any) =>
          isProcessed(img) &&
          (img.aiAnalysis?.originalImageId === orig.id || img.originalImageId === orig.id)
        );
        return noBgVersion || orig;
      });
    } else {
      // Original mode: just use originals
      cardImages = originalImages;
    }

    return { ...item, images: cardImages };
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900">Wardrobe Items</h3>
          {/* Switch Control */}
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
            <span className={`text-[10px] font-bold transition-colors ${showOriginalBackgrounds ? 'text-gray-900' : 'text-gray-400'}`}>Original</span>
            <Switch
              checked={!showOriginalBackgrounds}
              onCheckedChange={(checked) => setShowOriginalBackgrounds(!checked)}
              className="scale-75"
            />
            <span className={`text-[10px] font-bold transition-colors ${!showOriginalBackgrounds ? 'text-indigo-600' : 'text-gray-400'}`}>No BG</span>
          </div>
        </div>
        <a href="/wardrobe" className="text-[#00132d] hover:text-[#00132d]/70 text-sm font-medium flex items-center gap-1">
          View All →
        </a>
      </div>
      {wardrobeLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse bg-gray-50 rounded-xl aspect-[3/4] border border-gray-100" />
          ))}
        </div>
      ) : wardrobeItems.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No wardrobe items yet.</p>
          <Button onClick={() => window.location.href = '/wardrobe/add'} className="mt-4">
            Add Your First Item
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {wardrobeItems.slice(0, 8).map(item => {
            const cardItem = processItemImages(item);
            return (
              <WardrobeItemCard
                key={item.id}
                item={cardItem}
                onToggleFavorite={() => { }}
                onToggleForSale={() => { }}
                onView={() => router.push(`/wardrobe/${item.vufsCode}`)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}


export default function ProfilePage() {
  const { user, isAuthenticated, refreshAuth, logout: userLogout, activeAccount, setActiveAccount, isSwitchAccountModalOpen, setIsSwitchAccountModalOpen } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('wardrobe');
  const [wardrobeItems, setWardrobeItems] = useState<any[]>([]);
  const [wardrobeLoading, setWardrobeLoading] = useState(false);
  const [wardrobeError, setWardrobeError] = useState(false);
  const hasAttemptedWardrobeFetch = useRef(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  // Username state
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const usernameCheckTimeout = useRef<NodeJS.Timeout | null>(null);

  const [editForm, setEditForm] = useState({
    name: '',
    username: '',
    bio: '',
    profileImage: '',
    socialLinks: [] as { id?: string; platform: string; url: string }[],
    roles: [] as string[],
    privacySettings: {
      height: false,
      weight: false,
      birthDate: false,
      country: false,
      state: false,
      city: false,
      gender: false,
      telephone: true,
      likedItems: true,
      wishlists: true
    },
    birthDate: '',
    height: '',
    weight: '',
    country: '',
    state: '',
    city: '',
    cep: '',
    street: '',
    neighborhood: '',
    number: '',
    complement: '',
    gender: '',
    genderOther: '',
    bodyType: '',
    contactEmail: '',
    telephone: ''
  });

  // Cropper state
  const [showCropper, setShowCropper] = useState(false);
  const [cropperImageSrc, setCropperImageSrc] = useState<string>('');
  const [originalImageCache, setOriginalImageCache] = useState<Record<string, string>>({});
  const [photoQueue, setPhotoQueue] = useState<File[]>([]);
  const [bannerQueue, setBannerQueue] = useState<File[]>([]);
  const [croppingMode, setCroppingMode] = useState<'profile' | 'banner'>('profile');
  const [editingImageUrl, setEditingImageUrl] = useState<string | null>(null);
  const [showMeasurementManager, setShowMeasurementManager] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  // Refs for scrolling
  const profilePicturesRef = useRef<HTMLDivElement>(null);
  const bannersRef = useRef<HTMLDivElement>(null);

  // Banner slideshow state
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // Linked entities state
  interface LinkedEntity {
    brandId: string;
    brandName: string;
    brandSlug?: string;
    brandLogo?: string;
    businessType: string;
    roles: string[];
    title?: string;
    isOwner: boolean;
    followersCount: number;
    verificationStatus: string;
  }
  const [linkedEntities, setLinkedEntities] = useState<LinkedEntity[]>([]);

  // Drag and drop sensors for social links
  const socialLinksSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle social links drag end
  const handleSocialLinksDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = editForm.socialLinks.findIndex(link => link.platform === active.id);
      const newIndex = editForm.socialLinks.findIndex(link => link.platform === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedLinks = arrayMove(editForm.socialLinks, oldIndex, newIndex);
        setEditForm({ ...editForm, socialLinks: reorderedLinks });
      }
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      loadProfile();
    }
  }, [isAuthenticated, user]);

  // Fetch wardrobe items when wardrobe tab is active
  useEffect(() => {
    // Only fetch if:
    // - We're on the wardrobe tab
    // - We haven't already attempted to fetch
    // - We're not currently loading
    // - We don't have items yet
    // - We haven't encountered an error
    if (
      activeTab === 'wardrobe' &&
      !hasAttemptedWardrobeFetch.current &&
      !wardrobeLoading &&
      wardrobeItems.length === 0 &&
      !wardrobeError
    ) {
      const fetchWardrobeItems = async () => {
        hasAttemptedWardrobeFetch.current = true;
        setWardrobeLoading(true);
        setWardrobeError(false);
        try {
          const response = await apiClient.getWardrobeItems({ limit: 6 });
          setWardrobeItems(response.items || []);
        } catch (err) {
          console.error('Error fetching wardrobe items:', err);
          setWardrobeError(true);
        } finally {
          setWardrobeLoading(false);
        }
      };
      fetchWardrobeItems();
    }
  }, [activeTab, wardrobeItems.length, wardrobeLoading, wardrobeError]);

  // Banner slideshow - auto-rotate every 5 seconds (same as brands/stores)
  useEffect(() => {
    const banners = userProfile?.bannerImages || [];
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentBannerIndex(prev => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [userProfile?.bannerImages]);

  const loadProfile = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);
    try {
      // Fetch profile and linked entities in parallel
      const [profileResponse, membershipsResponse] = await Promise.all([
        apiClient.getUserProfile(user.id),
        apiClient.getMyMemberships().catch(() => ({ memberships: [] }))
      ]);

      console.log('DEBUG: getUserProfile response:', JSON.stringify(profileResponse, null, 2));
      setUserProfile(profileResponse.profile);
      setLinkedEntities(membershipsResponse.memberships || []);

      if (profileResponse.profile) {
        setEditForm({
          name: profileResponse.profile.name || profileResponse.profile.personalInfo?.name || '',
          username: profileResponse.profile.username || '',
          bio: profileResponse.profile.bio || profileResponse.profile.personalInfo?.bio || '',
          profileImage: profileResponse.profile.profileImage || profileResponse.profile.personalInfo?.avatarUrl || '',
          socialLinks: profileResponse.profile.socialLinks || [],
          roles: profileResponse.profile.roles || ['common_user'],
          privacySettings: profileResponse.profile.privacySettings || {
            height: false,
            weight: false,
            birthDate: false,
            country: false,
            state: false,
            city: false,
            gender: false,
            telephone: true, // Private by default
            likedItems: profileResponse.profile.privacySettings?.likedItems ?? true,
            wishlists: profileResponse.profile.privacySettings?.wishlists ?? true
          },
          birthDate: profileResponse.profile.personalInfo?.birthDate ? new Date(profileResponse.profile.personalInfo.birthDate).toISOString().split('T')[0] : '',
          height: profileResponse.profile.measurements?.height || '',
          weight: profileResponse.profile.measurements?.weight || '',
          country: profileResponse.profile.personalInfo?.location?.country || '',
          state: profileResponse.profile.personalInfo?.location?.state || '',
          city: profileResponse.profile.personalInfo?.location?.city || '',
          cep: profileResponse.profile.personalInfo?.location?.cep || '',
          street: profileResponse.profile.personalInfo?.location?.street || '',
          neighborhood: profileResponse.profile.personalInfo?.location?.neighborhood || '',
          number: profileResponse.profile.personalInfo?.location?.number || '',
          complement: profileResponse.profile.personalInfo?.location?.complement || '',
          gender: profileResponse.profile.personalInfo?.gender || '',
          genderOther: profileResponse.profile.personalInfo?.genderOther || '',
          bodyType: profileResponse.profile.personalInfo?.bodyType || '',
          contactEmail: profileResponse.profile.personalInfo?.contactEmail || '',
          telephone: profileResponse.profile.personalInfo?.telephone || ''
        });
      }
    } catch (err: any) {
      console.error('Error loading profile:', err);
      setError(err.message || 'Falha ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

  // Check username availability with debounce
  const checkUsername = useCallback(async (username: string) => {
    if (!username || username.length < 1) {
      setUsernameStatus('invalid');
      setUsernameError('Username is required');
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_.]*$/;
    if (!usernameRegex.test(username)) {
      setUsernameStatus('invalid');
      setUsernameError('Only letters, numbers, underscore, and dots allowed');
      return;
    }

    // Don't check if same as current username
    if (username === userProfile?.username) {
      setUsernameStatus('available');
      setUsernameError(null);
      return;
    }

    setUsernameStatus('checking');
    setUsernameError(null);

    try {
      const result = await apiClient.checkUsernameAvailability(username);
      if (result.available) {
        setUsernameStatus('available');
        setUsernameError(null);
      } else {
        setUsernameStatus('taken');
        setUsernameError(result.error || 'Username is already taken');
      }
    } catch (err) {
      setUsernameStatus('idle');
      setUsernameError('Failed to check username');
    }
  }, [userProfile?.username]);

  // Debounced username change handler
  const handleUsernameChange = (value: string) => {
    setEditForm({ ...editForm, username: value });

    // Clear previous timeout
    if (usernameCheckTimeout.current) {
      clearTimeout(usernameCheckTimeout.current);
    }

    // Set new timeout for debounced check
    usernameCheckTimeout.current = setTimeout(() => {
      checkUsername(value);
    }, 500);
  };

  // Calculate days until username can be changed
  const getUsernameChangeCooldown = () => {
    if (!userProfile?.usernameLastChanged) return null;
    const lastChanged = new Date(userProfile.usernameLastChanged);
    const daysSince = (Date.now() - lastChanged.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince >= 7) return null;
    return Math.ceil(7 - daysSince);
  };

  const handleCEPBlur = async () => {
    // Remove non-digits
    const cleanCEP = editForm.cep.replace(/\D/g, '');

    if (cleanCEP.length === 8) {
      setIsSaving(true); // Using isSaving as a general loading indicator for CEP
      try {
        const response = await apiClient.lookupCEP(cleanCEP);
        const { data } = response;

        setEditForm(prev => ({
          ...prev,
          street: data.street || prev.street,
          neighborhood: data.neighborhood || prev.neighborhood,
          city: data.city || prev.city,
          state: data.state || prev.state,
          country: 'Brazil'
        }));
        toast.success('Address found!');
      } catch (error: any) {
        console.error('Error fetching CEP:', error);
        toast.error(error.message || 'Error fetching address data.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleEditProfile = () => {
    if (userProfile) {
      setEditForm(prev => ({
        ...prev,
        username: userProfile.username || '',
        name: userProfile.name || userProfile.personalInfo?.name || '',
        bio: userProfile.bio || userProfile.personalInfo?.bio || '',
        profileImage: userProfile.profileImage || userProfile.personalInfo?.avatarUrl || '',
        socialLinks: userProfile.socialLinks || [],
        roles: userProfile.roles || ['common_user'],
        privacySettings: userProfile.privacySettings || {
          height: false,
          weight: false,
          birthDate: false,
          country: false,
          state: false,
          city: false,
          gender: false,
          telephone: true,
          likedItems: userProfile.privacySettings?.likedItems ?? true,
          wishlists: userProfile.privacySettings?.wishlists ?? true
        },
        birthDate: userProfile.personalInfo?.birthDate ? new Date(userProfile.personalInfo.birthDate).toISOString().split('T')[0] : '',
        height: userProfile.measurements?.height || '',
        weight: userProfile.measurements?.weight || '',
        country: userProfile.personalInfo?.location?.country || '',
        state: userProfile.personalInfo?.location?.state || '',
        city: userProfile.personalInfo?.location?.city || '',
        cep: userProfile.personalInfo?.location?.cep || '',
        street: userProfile.personalInfo?.location?.street || '',
        neighborhood: userProfile.personalInfo?.location?.neighborhood || '',
        number: userProfile.personalInfo?.location?.number || '',
        complement: userProfile.personalInfo?.location?.complement || '',
        gender: userProfile.personalInfo?.gender || '',
        genderOther: userProfile.personalInfo?.genderOther || '',
        bodyType: userProfile.personalInfo?.bodyType || '',
        contactEmail: userProfile.personalInfo?.contactEmail || '',
        telephone: userProfile.personalInfo?.telephone || ''
      }));
      setUsernameStatus('idle');
      setUsernameError(null);
      setIsEditing(true);
    }
  };

  const handleSaveProfile = async () => {
    if (!userProfile) return;

    // Check if username is valid before saving
    const usernameChanged = editForm.username !== userProfile.username;
    if (usernameChanged && usernameStatus !== 'available') {
      toast.error('Please choose a valid, available username before saving');
      return;
    }

    setIsSaving(true);
    try {
      await apiClient.updateProfile({
        name: editForm.name,
        username: usernameChanged ? editForm.username : undefined,
        bio: editForm.bio,
        socialLinks: editForm.socialLinks.filter(link => link.url && link.url.trim() !== ''),
        roles: editForm.roles,
        privacySettings: editForm.privacySettings,
        birthDate: editForm.birthDate,
        measurements: {
          height: Number(editForm.height),
          weight: Number(editForm.weight)
        },
        location: {
          cep: editForm.cep,
          street: editForm.street,
          number: editForm.number,
          complement: editForm.complement,
          neighborhood: editForm.neighborhood,
          city: editForm.city,
          state: editForm.state,
          country: 'Brazil'
        },
        gender: editForm.gender,
        genderOther: editForm.genderOther,
        bodyType: editForm.bodyType,
        contactEmail: editForm.contactEmail,
        telephone: editForm.telephone
      });
      await loadProfile();
      setIsEditing(false);
      toast.success('Profile saved successfully!');
    } catch (err: any) {
      const errorMessage = err.message || 'Unknown error';
      if (err.daysRemaining) {
        toast.error(`Cannot change username: ${err.daysRemaining} days remaining in cooldown`);
      } else {
        toast.error('Failed to save profile: ' + errorMessage);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !userProfile) return;

    // Check if already at max profile images
    const currentImages = userProfile.profileImages || [];
    if (currentImages.length >= 5) {
      toast.error('Maximum 5 profile pictures allowed. Remove one to add more.');
      return;
    }

    const remainingSlots = 5 - currentImages.length;
    const filesToProcess = files.slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      toast.warning(`Only ${remainingSlots} more photos can be added. Skipping the rest.`);
    }

    const processedFiles: File[] = [];

    setIsSaving(true);
    try {
      for (let file of filesToProcess) {
        // Handle HEIC/HEIF files
        if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
          try {
            toast.info(`Converting "${file.name}"...`);
            const heic2any = (await import('heic2any')).default;
            const convertedBlob = await heic2any({
              blob: file,
              toType: 'image/jpeg',
              quality: 0.8
            });
            const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
            file = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' });
          } catch (error) {
            console.error('HEIC conversion failed:', error);
            toast.error(`Failed to process "${file.name}".`);
            continue;
          }
        }
        processedFiles.push(file);
      }

      if (processedFiles.length > 0) {
        setCroppingMode('profile');
        setPhotoQueue(processedFiles);
        // Start cropping the first one
        const reader = new FileReader();
        reader.addEventListener('load', () => {
          setCropperImageSrc(reader.result?.toString() || '');
          setShowCropper(true);
        });
        reader.readAsDataURL(processedFiles[0]);
      }
    } finally {
      setIsSaving(false);
      e.target.value = '';
    }
  };

  const handleCropSave = async (croppedBlob: Blob) => {
    if (!userProfile) return;

    const currentFile = photoQueue[0] || (croppingMode === 'banner' ? bannerQueue[0] : null);
    const fileName = currentFile ? currentFile.name : (editingImageUrl ? 'edit.jpg' : (croppingMode === 'profile' ? 'avatar.jpg' : 'banner.jpg'));
    const file = new File([croppedBlob], fileName, { type: 'image/jpeg' });

    try {
      setIsSaving(true);

      let uploadedUrl: string;

      if (croppingMode === 'profile') {
        const result = await apiClient.uploadAvatar(file);
        uploadedUrl = result.avatarUrl;

        // Update profile images list
        const currentImages = [...(userProfile.profileImages || [])];
        if (editingImageUrl) {
          const idx = currentImages.indexOf(editingImageUrl);
          if (idx !== -1) {
            currentImages[idx] = uploadedUrl;
            await apiClient.updateProfileImages(currentImages);
          }
        } else if (!currentImages.includes(uploadedUrl)) {
          // Prepend (not append) so the new image becomes the main profile picture
          currentImages.unshift(uploadedUrl);
          await apiClient.updateProfileImages(currentImages);
        }
      } else {
        const result = await apiClient.uploadBanner(file);
        uploadedUrl = result.bannerUrl;

        // Update banner images list
        const currentBanners = [...(userProfile.bannerImages || [])];
        if (editingImageUrl) {
          const idx = currentBanners.indexOf(editingImageUrl);
          if (idx !== -1) {
            currentBanners[idx] = uploadedUrl;
            await apiClient.updateBannerImages(currentBanners);
          }
        } else if (!currentBanners.includes(uploadedUrl)) {
          currentBanners.push(uploadedUrl);
          await apiClient.updateBannerImages(currentBanners);
        }
      }

      await loadProfile();
      if (croppingMode === 'profile') {
        await refreshAuth();
      }

      // Handle queue if any
      if (editingImageUrl) {
        // We were editing a single existing image
        // Cache the original image for this session
        if (uploadedUrl) {
          setOriginalImageCache(prev => ({
            ...prev,
            [uploadedUrl]: cropperImageSrc
          }));
        }

        setShowCropper(false);
        setCropperImageSrc('');
        setEditingImageUrl(null);
        toast.success(`Image updated successfully!`);
      } else {
        // Multi-upload queue logic
        if (croppingMode === 'profile') {
          const nextQueue = photoQueue.slice(1);
          setPhotoQueue(nextQueue);
          if (nextQueue.length > 0) {
            const reader = new FileReader();
            reader.onload = () => {
              setCropperImageSrc(reader.result?.toString() || '');
            };
            reader.readAsDataURL(nextQueue[0]);
            toast.info(`Photo added. ${nextQueue.length} more to crop...`);
            return; // Exit and wait for next crop
          }
        } else {
          const nextQueue = bannerQueue.slice(1);
          setBannerQueue(nextQueue);
          if (nextQueue.length > 0) {
            const reader = new FileReader();
            reader.onload = () => {
              setCropperImageSrc(reader.result?.toString() || '');
            };
            reader.readAsDataURL(nextQueue[0]);
            toast.info(`Banner added. ${nextQueue.length} more to crop...`);
            return; // Exit and wait for next crop
          }
        }

        // Cache the original image for this session
        // This allows the user to re-edit the image with the full original source
        // even after it has been cropped and saved
        if (uploadedUrl) {
          setOriginalImageCache(prev => ({
            ...prev,
            [uploadedUrl]: cropperImageSrc
          }));
        }

        setShowCropper(false);
        setCropperImageSrc('');
        toast.success('All images saved to your profile!');
      }
    } catch (err: any) {
      toast.error('Failed to upload image: ' + (err.message || 'Unknown error'));
      setShowCropper(false);
      setPhotoQueue([]);
      setBannerQueue([]);
      setEditingImageUrl(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfileImagesOrderChange = async (newImages: string[]) => {
    try {
      await apiClient.updateProfileImages(newImages);
      await loadProfile();
      await refreshAuth();
    } catch (err: any) {
      toast.error('Failed to update photos order: ' + (err.message || 'Unknown error'));
    }
  };

  const handleRemoveProfileImage = async (index: number) => {
    if (!userProfile?.profileImages) return;
    try {
      const newImages = [...userProfile.profileImages];
      newImages.splice(index, 1);
      await apiClient.updateProfileImages(newImages);
      await loadProfile();
      await refreshAuth();
      toast.success('Photo removed');
    } catch (err: any) {
      toast.error('Failed to remove photo: ' + (err.message || 'Unknown error'));
    }
  };

  const handleBannerImagesOrderChange = async (newBanners: string[]) => {
    try {
      await apiClient.updateBannerImages(newBanners);
      await loadProfile();
    } catch (err: any) {
      toast.error('Failed to update banners order: ' + (err.message || 'Unknown error'));
    }
  };

  const handleRemoveBannerImage = async (index: number) => {
    if (!userProfile?.bannerImages) return;
    try {
      const newBanners = [...userProfile.bannerImages];
      newBanners.splice(index, 1);
      await apiClient.updateBannerImages(newBanners);
      await loadProfile();
      toast.success('Banner removed');
    } catch (err: any) {
      toast.error('Failed to remove banner: ' + (err.message || 'Unknown error'));
    }
  };

  const handleEditExistingPhoto = (url: string) => {
    setCroppingMode('profile');
    setEditingImageUrl(url);
    // Use cached original if available, otherwise fall back to the current URL
    setCropperImageSrc(originalImageCache[url] || getImageUrl(url));
    setShowCropper(true);
    setPhotoQueue([]);
  };

  const handleEditExistingBanner = (bannerUrl: string) => {
    setCroppingMode('banner');
    setEditingImageUrl(bannerUrl);
    // Use cached original if available, otherwise fall back to the current URL
    setCropperImageSrc(originalImageCache[bannerUrl] || getImageUrl(bannerUrl));
    setShowCropper(true);
    setBannerQueue([]);
  };

  const scrollToProfilePictures = () => {
    setIsEditing(true);
    setTimeout(() => {
      profilePicturesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const scrollToBanners = () => {
    setIsEditing(true);
    setTimeout(() => {
      bannersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !userProfile) return;

    // Check if already at max banners
    const currentBanners = userProfile.bannerImages || [];
    if (currentBanners.length >= 5) {
      toast.error('Maximum 5 banner images allowed. Remove one to add more.');
      return;
    }

    const remainingSlots = 5 - currentBanners.length;
    const filesToProcess = files.slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      toast.warning(`Only ${remainingSlots} more banners can be added. Skipping the rest.`);
    }

    const processedFiles: File[] = [];

    setIsSaving(true);
    try {
      for (let file of filesToProcess) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error(`"${file.name}" is not an image file.`);
          continue;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`"${file.name}" is too large (max 10MB).`);
          continue;
        }

        // Handle HEIC/HEIF files
        if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
          try {
            toast.info(`Converting "${file.name}"...`);
            const heic2any = (await import('heic2any')).default;
            const convertedBlob = await heic2any({
              blob: file,
              toType: 'image/jpeg',
              quality: 0.8
            });
            const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
            file = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' });
          } catch (error) {
            console.error('HEIC conversion failed:', error);
            toast.error(`Failed to process "${file.name}".`);
            continue;
          }
        }
        processedFiles.push(file);
      }

      if (processedFiles.length > 0) {
        setCroppingMode('banner');
        setBannerQueue(processedFiles);
        // Start cropping the first one
        const reader = new FileReader();
        reader.addEventListener('load', () => {
          setCropperImageSrc(reader.result?.toString() || '');
          setShowCropper(true);
        });
        reader.readAsDataURL(processedFiles[0]);
      }
    } finally {
      setIsSaving(false);
      e.target.value = '';
    }
  };


  // Authentication and Loading checks
  if (!isAuthenticated) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p>Please log in to view your profile.</p></div>;
  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p>Loading profile...</p></div>;
  if (error && !userProfile) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-red-500">Error: {error}</p></div>;
  if (!userProfile) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p>Profile not found.</p></div>;

  return (
    <div className="min-h-screen bg-gray-50">


      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          {/* Banner Section - Slideshow with animation like brands/stores */}
          <div className="relative -m-6 mb-6 h-48 md:h-64 bg-gradient-to-r from-[#00132d] to-[#1e3a5f] rounded-t-lg overflow-hidden group">
            {(() => {
              const banners = userProfile.bannerImages || [];
              const currentBanner = banners[currentBannerIndex] || userProfile.bannerImage;

              if (currentBanner) {
                return (
                  <>
                    {/* Current Banner with fade transition */}
                    <div
                      key={currentBannerIndex}
                      className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
                      style={{
                        backgroundImage: `url(${getImageUrl(currentBanner)})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    />

                    {/* Dot Indicators - only show if multiple banners */}
                    {banners.length > 1 && (
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
                        {banners.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentBannerIndex(idx)}
                            className={`w-2 h-2 rounded-full transition-all ${idx === currentBannerIndex
                              ? 'bg-white w-4'
                              : 'bg-white/50 hover:bg-white/80'
                              }`}
                            aria-label={`Go to slide ${idx + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </>
                );
              } else {
                return (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-white/50 text-sm">Hover to add banner images</span>
                  </div>
                );
              }
            })()}

            {/* Banner Edit/Upload Button */}
            <button
              onClick={scrollToBanners}
              className="absolute top-3 right-3 bg-white/90 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-white transition-colors shadow-lg cursor-pointer flex items-center gap-2 opacity-0 group-hover:opacity-100 z-20"
            >
              <CameraIcon className="h-4 w-4" />
              <span className="text-sm font-medium">
                Add Banners
              </span>
            </button>
          </div>

          <div className="flex items-start space-x-6">
            {/* Avatar */}
            <div className="relative">
              {userProfile.profileImage ? (
                <img
                  src={getImageUrl(userProfile.profileImage)}
                  alt={userProfile.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 bg-[#00132d] rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                  <span className="text-[#fff7d7] text-2xl font-bold">
                    {userProfile.name?.charAt(0) || 'U'}
                  </span>
                </div>
              )}
              <button
                onClick={scrollToProfilePictures}
                className="absolute bottom-0 right-0 bg-[#00132d] text-[#fff7d7] p-2 rounded-full hover:bg-[#00132d]/90 transition-colors shadow-lg cursor-pointer"
              >
                <CameraIcon className="h-4 w-4" />
              </button>

              {/* Edit Existing Button */}
              {userProfile.profileImage && (
                <button
                  onClick={() => handleEditExistingPhoto(userProfile.profileImage || '')}
                  className="absolute bottom-0 left-0 bg-white text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors shadow-lg border border-gray-200"
                  title="Adjust photo"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-[#00132d] focus:outline-none focus:border-[#00132d]/70"
                    placeholder="Your name"
                  />

                  {/* Username Field */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    {(() => {
                      const cooldownDays = getUsernameChangeCooldown();
                      if (cooldownDays) {
                        return (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-sm text-yellow-800">
                              ⏳ Username can only be changed once every 7 days.
                              <strong> {cooldownDays} day{cooldownDays > 1 ? 's' : ''} remaining.</strong>
                            </p>
                            <p className="text-sm text-gray-600 mt-1">Current: @{userProfile.username}</p>
                          </div>
                        );
                      }
                      return (
                        <div className="relative">
                          <div className="flex items-center">
                            <span className="text-gray-400 mr-1">@</span>
                            <input
                              type="text"
                              value={editForm.username}
                              onChange={(e) => handleUsernameChange(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                              className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${usernameStatus === 'available' ? 'border-green-300 focus:ring-green-200' :
                                usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'border-red-300 focus:ring-red-200' :
                                  'border-gray-300 focus:ring-[#00132d]/20'
                                }`}
                              placeholder="username"
                              maxLength={30}
                            />
                            <div className="ml-2 w-6">
                              {usernameStatus === 'checking' && (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#00132d]"></div>
                              )}
                              {usernameStatus === 'available' && (
                                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                              )}
                              {(usernameStatus === 'taken' || usernameStatus === 'invalid') && (
                                <XCircleIcon className="h-5 w-5 text-red-500" />
                              )}
                            </div>
                          </div>
                          {usernameError && (
                            <p className="text-sm text-red-600 mt-1">{usernameError}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">1-30 characters, letters, numbers, underscore, and dots only</p>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Roles Selection */}
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Experiences (Roles)</h4>
                    <p className="text-sm text-gray-500 mb-2">Select the experiences you want to have access to:</p>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_ROLES.map((role) => {
                        const isSelected = editForm.roles.includes(role.id);
                        return (
                          <button
                            key={role.id}
                            onClick={() => {
                              const newRoles = isSelected
                                ? editForm.roles.filter(r => r !== role.id)
                                : [...editForm.roles, role.id];
                              setEditForm({ ...editForm, roles: newRoles });
                            }}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors border ${isSelected
                              ? 'bg-[#00132d] text-[#fff7d7] border-[#00132d]'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-[#00132d]'
                              }`}
                          >
                            {role.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    className="w-full text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[#00132d] resize-none"
                    rows={3}
                    placeholder="Tell us about yourself..."
                  />

                  {/* Personal Info Section */}
                  <div className="space-y-4 pt-2 border-t border-gray-100">
                    <h4 className="font-medium text-gray-700">Personal Info (Privacy Control)</h4>
                    <p className="text-sm text-gray-500 mb-4">
                      Control visibility of your personal details.
                      <span className="flex items-center gap-1 mt-1">
                        <LockClosedIcon className="w-3 h-3" /> Locked items are private and cannot be made public.
                      </span>
                    </p>

                    <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
                      {/* Editable Toggleable Fields */}
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col flex-1 mr-4">
                          <label className="text-sm font-medium text-gray-700">Birth Date</label>
                          <input
                            type="date"
                            value={editForm.birthDate}
                            onChange={(e) => setEditForm({ ...editForm, birthDate: e.target.value })}
                            className="text-sm text-gray-600 bg-white border border-gray-200 rounded px-2 py-1 mt-1 focus:outline-none focus:border-[#00132d]"
                          />
                        </div>
                        <button
                          onClick={() => setEditForm(prev => ({
                            ...prev,
                            privacySettings: {
                              ...prev.privacySettings,
                              birthDate: !prev.privacySettings.birthDate
                            }
                          }))}
                          className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-sm ${editForm.privacySettings.birthDate ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-600'
                            }`}
                        >
                          {editForm.privacySettings.birthDate ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex flex-col flex-1 mr-4">
                          <label className="text-sm font-medium text-gray-700">Height (cm)</label>
                          <input
                            type="number"
                            value={editForm.height}
                            onChange={(e) => setEditForm({ ...editForm, height: e.target.value })}
                            className="text-sm text-gray-600 bg-white border border-gray-200 rounded px-2 py-1 mt-1 focus:outline-none focus:border-[#00132d]"
                            placeholder="e.g. 175"
                          />
                        </div>
                        <button
                          onClick={() => setEditForm(prev => ({
                            ...prev,
                            privacySettings: {
                              ...prev.privacySettings,
                              height: !prev.privacySettings.height
                            }
                          }))}
                          className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-sm ${editForm.privacySettings.height ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-600'
                            }`}
                        >
                          {editForm.privacySettings.height ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex flex-col flex-1 mr-4">
                          <label className="text-sm font-medium text-gray-700">Weight (kg)</label>
                          <input
                            type="number"
                            value={editForm.weight}
                            onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
                            className="text-sm text-gray-600 bg-white border border-gray-200 rounded px-2 py-1 mt-1 focus:outline-none focus:border-[#00132d]"
                            placeholder="e.g. 70"
                          />
                        </div>
                        <button
                          onClick={() => setEditForm(prev => ({
                            ...prev,
                            privacySettings: {
                              ...prev.privacySettings,
                              weight: !prev.privacySettings.weight
                            }
                          }))}
                          className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-sm ${editForm.privacySettings.weight ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-600'
                            }`}
                        >
                          {editForm.privacySettings.weight ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
                        </button>
                      </div>

                      <div className="flex flex-col space-y-2 py-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-gray-700">Gender</label>
                          <button
                            onClick={() => setEditForm(prev => ({
                              ...prev,
                              privacySettings: {
                                ...prev.privacySettings,
                                gender: !prev.privacySettings.gender
                              }
                            }))}
                            className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-sm ${editForm.privacySettings.gender ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-600'
                              }`}
                          >
                            {editForm.privacySettings.gender ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
                          </button>
                        </div>
                        <div className="flex gap-4">
                          {['male', 'female', 'other', 'prefer-not-to-say'].map((option) => (
                            <label key={option} className="flex items-center cursor-pointer">
                              <input
                                type="radio"
                                name="gender"
                                value={option}
                                checked={editForm.gender === option}
                                onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                                className="w-4 h-4 text-pink-600 focus:ring-pink-500 border-gray-300"
                              />
                              <span className="ml-2 text-sm text-gray-700 capitalize">
                                {option === 'male' ? 'Masculino' : option === 'female' ? 'Feminino' : option === 'prefer-not-to-say' ? 'Prefer not to say' : 'Outro'}
                              </span>
                            </label>
                          ))}
                        </div>
                        {editForm.gender === 'other' && (
                          <div className="space-y-3 pl-4 border-l-2 border-pink-100 mt-2">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Specify (optional)</label>
                              <input
                                type="text"
                                name="genderOther"
                                value={editForm.genderOther}
                                onChange={(e) => setEditForm({ ...editForm, genderOther: e.target.value })}
                                placeholder="ex: Non-binary"
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Body Type (for virtual try-on)</label>
                              <div className="flex gap-4">
                                {['male', 'female'].map((type) => (
                                  <label key={type} className="flex items-center cursor-pointer">
                                    <input
                                      type="radio"
                                      name="bodyType"
                                      value={type}
                                      checked={editForm.bodyType === type}
                                      onChange={(e) => setEditForm({ ...editForm, bodyType: e.target.value })}
                                      className="w-4 h-4 text-pink-600 focus:ring-pink-500 border-gray-300"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">
                                      {type === 'male' ? 'Male' : 'Female'}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex flex-col flex-1 mr-4">
                          <label className="text-sm font-medium text-gray-700">Contact Email (Public)</label>
                          <input
                            type="email"
                            value={editForm.contactEmail}
                            onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })}
                            className="text-sm text-gray-600 bg-white border border-gray-200 rounded px-2 py-1 mt-1 focus:outline-none focus:border-[#00132d]"
                            placeholder="public@email.com"
                          />
                        </div>
                        <div className="p-2 text-sm text-gray-500 flex items-center gap-2">
                          <EyeIcon className="w-4 h-4 text-blue-800" />
                          <span className="text-xs">Always Public (if set)</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex flex-col flex-1 mr-4">
                          <label className="text-sm font-medium text-gray-700">Telephone (WhatsApp)</label>
                          <input
                            type="tel"
                            value={editForm.telephone}
                            onChange={(e) => setEditForm({ ...editForm, telephone: formatPhone(e.target.value) })}
                            className="text-sm text-gray-600 bg-white border border-gray-200 rounded px-2 py-1 mt-1 focus:outline-none focus:border-[#00132d]"
                            placeholder="(00) 00000-0000"
                          />
                        </div>
                        <button
                          onClick={() => setEditForm(prev => ({
                            ...prev,
                            privacySettings: {
                              ...prev.privacySettings,
                              telephone: !prev.privacySettings.telephone
                            }
                          }))}
                          className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-sm ${editForm.privacySettings.telephone ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-600'
                            }`}
                        >
                          {editForm.privacySettings.telephone ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Content Visibility Settings */}
                      <div className="border-t border-gray-100 pt-4 mt-4 space-y-4">
                        <h5 className="text-sm font-medium text-gray-700">Content Visibility</h5>

                        <div className="flex items-center justify-between">
                          <div className="flex flex-col flex-1 mr-4">
                            <label className="text-sm font-medium text-gray-700 font-bold">Liked Items Tab</label>
                            <p className="text-xs text-gray-500">Show the items you've liked on your public profile</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditForm(prev => ({
                              ...prev,
                              privacySettings: {
                                ...prev.privacySettings,
                                likedItems: !prev.privacySettings.likedItems
                              }
                            }))}
                            className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-sm ${editForm.privacySettings.likedItems ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-600'
                              }`}
                          >
                            {editForm.privacySettings.likedItems ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
                            <span>{editForm.privacySettings.likedItems ? 'Visible' : 'Private'}</span>
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex flex-col flex-1 mr-4">
                            <label className="text-sm font-medium text-gray-700 font-bold">Wishlists Tab</label>
                            <p className="text-xs text-gray-500">Show your wishlists on your public profile</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditForm(prev => ({
                              ...prev,
                              privacySettings: {
                                ...prev.privacySettings,
                                wishlists: !prev.privacySettings.wishlists
                              }
                            }))}
                            className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-sm ${editForm.privacySettings.wishlists ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-600'
                              }`}
                          >
                            {editForm.privacySettings.wishlists ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
                            <span>{editForm.privacySettings.wishlists ? 'Visible' : 'Private'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Locked Fields */}
                      <div className="border-t border-gray-200 my-2 pt-2"></div>

                      {/* Locked Fields - CPF */}
                      <div className="border-t border-gray-200 my-2 pt-2"></div>

                      <div className="flex items-center justify-between opacity-70">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            CPF <LockClosedIcon className="w-3 h-3 text-gray-400" />
                          </span>
                          <span className="text-xs text-gray-500">{userProfile.cpf ? userProfile.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.***.***-$4') : 'Not set'}</span>
                        </div>
                        <div className="px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg text-xs font-medium flex items-center gap-1 cursor-not-allowed">
                          <LockClosedIcon className="w-3 h-3" />
                          Private
                        </div>
                      </div>

                      {/* Address Fields - Private but Editable */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            Address
                          </h5>
                          {/* Some fields are permanently private */}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-1">
                            <label className="text-xs text-gray-500">CEP (Postal Code)</label>
                            <input
                              type="text"
                              value={editForm.cep}
                              onChange={(e) => setEditForm({ ...editForm, cep: formatCEP(e.target.value) })}
                              onBlur={handleCEPBlur}
                              className="w-full text-sm text-gray-600 bg-white border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-[#00132d]"
                              placeholder="00000-000"
                              maxLength={9}
                            />
                            <p className="text-[10px] text-gray-400 mt-1">Type CEP to auto-fill address</p>
                          </div>

                          <div className="col-span-1">
                            <label className="text-xs text-gray-500">Country</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editForm.country}
                                onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                                className="w-full text-sm text-gray-600 bg-white border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-[#00132d]"
                                placeholder="Country"
                              />
                              <button
                                onClick={() => setEditForm(prev => ({
                                  ...prev,
                                  privacySettings: {
                                    ...prev.privacySettings,
                                    country: !prev.privacySettings.country
                                  }
                                }))}
                                className={`p-1.5 rounded-lg transition-colors text-sm ${editForm.privacySettings.country ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-600'}`}
                                title={editForm.privacySettings.country ? "Visible" : "Private"}
                              >
                                {editForm.privacySettings.country ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          <div className="col-span-1">
                            <label className="text-xs text-gray-500">State</label>
                            <div className="flex items-center gap-2">
                              <select
                                value={editForm.state}
                                onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                                className="w-full text-sm text-gray-600 bg-white border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-[#00132d]"
                              >
                                <option value="">Select State</option>
                                {BRAZILIAN_STATES.map(state => (
                                  <option key={state.value} value={state.value}>
                                    {state.label}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => setEditForm(prev => ({
                                  ...prev,
                                  privacySettings: {
                                    ...prev.privacySettings,
                                    state: !prev.privacySettings.state
                                  }
                                }))}
                                className={`p-1.5 rounded-lg transition-colors text-sm ${editForm.privacySettings.state ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-600'}`}
                                title={editForm.privacySettings.state ? "Visible" : "Private"}
                              >
                                {editForm.privacySettings.state ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          <div className="col-span-1">
                            <label className="text-xs text-gray-500">City</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editForm.city}
                                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                                className="w-full text-sm text-gray-600 bg-white border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-[#00132d]"
                                placeholder="City"
                              />
                              <button
                                onClick={() => setEditForm(prev => ({
                                  ...prev,
                                  privacySettings: {
                                    ...prev.privacySettings,
                                    city: !prev.privacySettings.city
                                  }
                                }))}
                                className={`p-1.5 rounded-lg transition-colors text-sm ${editForm.privacySettings.city ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-600'}`}
                                title={editForm.privacySettings.city ? "Visible" : "Private"}
                              >
                                {editForm.privacySettings.city ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          <div className="col-span-2">
                            <label className="text-xs text-gray-500">Neighborhood</label>
                            <input
                              type="text"
                              value={editForm.neighborhood}
                              onChange={(e) => setEditForm({ ...editForm, neighborhood: e.target.value })}
                              className="w-full text-sm text-gray-600 bg-white border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-[#00132d]"
                              placeholder="Neighborhood"
                            />
                          </div>

                          <div className="col-span-2">
                            <label className="text-xs text-gray-500">Street</label>
                            <input
                              type="text"
                              value={editForm.street}
                              onChange={(e) => setEditForm({ ...editForm, street: e.target.value })}
                              className="w-full text-sm text-gray-600 bg-white border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-[#00132d]"
                              placeholder="Street Address"
                            />
                          </div>

                          <div className="col-span-1">
                            <label className="text-xs text-gray-500">Number</label>
                            <input
                              type="text"
                              value={editForm.number}
                              onChange={(e) => setEditForm({ ...editForm, number: e.target.value })}
                              className="w-full text-sm text-gray-600 bg-white border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-[#00132d]"
                              placeholder="No."
                            />
                          </div>

                          <div className="col-span-1">
                            <label className="text-xs text-gray-500">Complement</label>
                            <input
                              type="text"
                              value={editForm.complement}
                              onChange={(e) => setEditForm({ ...editForm, complement: e.target.value })}
                              className="w-full text-sm text-gray-600 bg-white border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-[#00132d]"
                              placeholder="Apt, Block, etc."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mt-4">
                    <h4 className="font-medium text-gray-700">Social Links</h4>
                    <p className="text-xs text-gray-500 italic">Drag to reorder • Links with content will appear on your profile</p>
                    <DndContext
                      sensors={socialLinksSensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleSocialLinksDragEnd}
                    >
                      <SortableContext
                        items={editForm.socialLinks.map(link => link.id || link.platform)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="grid grid-cols-1 gap-3">
                          {editForm.socialLinks.map((link) => {
                            // Calculate index for Website display
                            const websiteIndex = link.platform === 'Website'
                              ? editForm.socialLinks.filter(l => l.platform === 'Website').findIndex(l => (l.id || l.platform) === (link.id || link.platform)) + 1
                              : undefined;
                            return (
                              <SortableSocialLinkItem
                                key={link.id || link.platform}
                                id={link.id || link.platform}
                                platform={link.platform}
                                url={link.url}
                                index={websiteIndex}
                                onChange={(newUrl) => {
                                  const newLinks = editForm.socialLinks.map(l =>
                                    (l.id || l.platform) === (link.id || link.platform)
                                      ? { ...l, url: newUrl }
                                      : l
                                  );
                                  setEditForm({ ...editForm, socialLinks: newLinks });
                                }}
                                onRemove={() => {
                                  const newLinks = editForm.socialLinks.filter(
                                    l => (l.id || l.platform) !== (link.id || link.platform)
                                  );
                                  setEditForm({ ...editForm, socialLinks: newLinks });
                                }}
                              />
                            );
                          })}
                        </div>
                      </SortableContext>
                    </DndContext>

                    {/* Add new social links */}
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-2">Add more platforms:</p>
                      <div className="flex flex-wrap gap-2">
                        {SOCIAL_PLATFORMS.filter(platform => {
                          const count = editForm.socialLinks.filter(l => l.platform === platform).length;
                          if (MULTI_ENTRY_PLATFORMS.includes(platform)) {
                            return count < MAX_MULTI_ENTRIES;
                          }
                          return count === 0;
                        }).map((platform) => {
                          const count = editForm.socialLinks.filter(l => l.platform === platform).length;
                          const isMulti = MULTI_ENTRY_PLATFORMS.includes(platform);
                          const showCount = isMulti && count > 0;
                          return (
                            <button
                              key={platform}
                              type="button"
                              onClick={() => {
                                const newLink = {
                                  id: generateSocialLinkId(),
                                  platform,
                                  url: ''
                                };
                                setEditForm({
                                  ...editForm,
                                  socialLinks: [...editForm.socialLinks, newLink]
                                });
                              }}
                              className="inline-flex items-center gap-1.5 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                            >
                              <SocialIcon platform={platform} size="xs" />
                              {platform}
                              {showCount && <span className="text-gray-400">({count}/{MAX_MULTI_ENTRIES})</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Multi-Photo Management */}
                  <div className="mt-8 pt-6 border-t border-gray-100" ref={profilePicturesRef}>
                    <h3 className="text-xs font-semibold text-gray-500 mb-4 uppercase tracking-wider flex items-center gap-2">
                      <UserIcon className="h-4 w-4" /> Profile Pictures (Max 5)
                    </h3>
                    <SortableImageGrid
                      images={userProfile.profileImages || []}
                      onOrderChange={handleProfileImagesOrderChange}
                      onRemoveImage={handleRemoveProfileImage}
                      onEditImage={(url) => handleEditExistingPhoto(url)}
                      onAddImage={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.multiple = true;
                        input.onchange = (e) => handleImageUpload(e as any);
                        input.click();
                      }}
                      maxImages={5}
                      columns={5}
                      helperText="Drag and drop to reorder. The first photo is your main profile picture."
                    />
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-100" ref={bannersRef}>
                    <h3 className="text-xs font-semibold text-gray-500 mb-4 uppercase tracking-wider flex items-center gap-2">
                      <BuildingStorefrontIcon className="h-4 w-4" /> Profile Banners (Max 5)
                    </h3>
                    <SortableImageGrid
                      images={userProfile.bannerImages || []}
                      onOrderChange={handleBannerImagesOrderChange}
                      onRemoveImage={handleRemoveBannerImage}
                      onEditImage={(url) => handleEditExistingBanner(url)}
                      onAddImage={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.multiple = true;
                        input.onchange = (e) => handleBannerUpload(e as any);
                        input.click();
                      }}
                      maxImages={5}
                      columns={3}
                      aspectRatio="aspect-[4/1]"
                      helperText="Drag and drop to reorder. The first banner is the main one in your profile."
                    />
                  </div>

                  <div className="flex space-x-2 pt-4">
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving || (editForm.username !== userProfile.username && usernameStatus !== 'available')}
                      className={`px-4 py-2 rounded-lg transition-colors flex items-center ${isSaving || (editForm.username !== userProfile.username && usernameStatus !== 'available')
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-[#00132d] text-[#fff7d7] hover:bg-[#00132d]/90'
                        }`}
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : 'Save'}
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      disabled={isSaving}
                      className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      {userProfile.name}
                      {userProfile.verificationStatus === 'verified' && <VerifiedBadge size="sm" />}
                    </h1>
                    <button
                      onClick={handleEditProfile}
                      className="text-gray-500 hover:text-[#00132d] transition-colors"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <p className="text-gray-600 mb-1">@{userProfile.username}</p>

                  {/* Roles Display */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {userProfile.roles && userProfile.roles
                      .filter(roleId => !['consumer', 'common_user', 'admin'].includes(roleId))
                      .map((roleId) => {
                        const role = AVAILABLE_ROLES.find(r => r.id === roleId) || { label: roleId };
                        return (
                          <span key={roleId} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full border border-gray-200 font-medium">
                            {role.label}
                          </span>
                        );
                      })}
                    {/* Admin badge - shown separately with special styling */}
                    {userProfile.roles?.includes('admin') && (
                      <span className="px-2 py-0.5 bg-gray-900 text-white text-xs rounded font-bold">
                        ADMIN
                      </span>
                    )}
                  </div>

                  {/* Contact Info Display */}
                  <div className="space-y-1 mb-3">
                    {userProfile.personalInfo?.contactEmail && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium mr-1">Email:</span>
                        <a href={`mailto:${userProfile.personalInfo.contactEmail}`} className="hover:text-[#00132d] underline">
                          {userProfile.personalInfo.contactEmail}
                        </a>
                      </p>
                    )}

                    {userProfile.privacySettings?.telephone && userProfile.personalInfo?.telephone && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium mr-1">Phone:</span>
                        {userProfile.personalInfo.telephone}
                      </p>
                    )}
                  </div>

                  {userProfile.bio && (
                    <p className="text-gray-700 mb-3">{userProfile.bio}</p>
                  )}

                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-500 flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        Joined {new Date(userProfile.createdAt).toLocaleDateString()}
                        <span className="mx-2">|</span>
                        Born {userProfile.personalInfo?.birthDate ? (() => {
                          const d = new Date(userProfile.personalInfo.birthDate);
                          // Display date using UTC parts to avoid timezone shift
                          return `${d.getUTCDate().toString().padStart(2, '0')}/${(d.getUTCMonth() + 1).toString().padStart(2, '0')}/${d.getUTCFullYear()}`;
                        })() : 'unknown'}
                        {/* Display location based on privacy settings */}
                        {(userProfile.privacySettings?.city || userProfile.privacySettings?.state || userProfile.privacySettings?.country) && userProfile.personalInfo?.location && (
                          <>
                            <span className="mx-2">|</span>
                            📍 {[
                              userProfile.privacySettings?.city && userProfile.personalInfo.location.city,
                              userProfile.privacySettings?.state && userProfile.personalInfo.location.state,
                              userProfile.privacySettings?.country && userProfile.personalInfo.location.country
                            ].filter(Boolean).join(', ')}
                          </>
                        )}
                        {/* Gender Display - Only show for male/female with icons */}
                        {userProfile.privacySettings?.gender && userProfile.personalInfo?.gender &&
                          (userProfile.personalInfo.gender === 'male' || userProfile.personalInfo.gender === 'female') && (
                            <>
                              <span className="mx-2">|</span>
                              {userProfile.personalInfo.gender === 'male' ? (
                                <span className="text-blue-500 font-medium">♂</span>
                              ) : (
                                <span className="text-pink-500 font-medium">♀</span>
                              )}
                            </>
                          )}
                      </span>
                    </div>

                    {userProfile.socialLinks && userProfile.socialLinks.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {userProfile.socialLinks.map((link) => (
                          <a
                            key={link.platform}
                            href={link.url.startsWith('http') ? link.url : `https://${link.platform.toLowerCase()}.com/${link.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-xs font-medium transition-colors flex items-center"
                          >
                            <SocialIcon platform={link.platform} size="xs" className="mr-1.5" />
                            {link.platform}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Action Buttons */}
            {!isEditing && (
              <div className="flex items-center gap-2">
                {/* Switch Account Button */}
                <button
                  onClick={() => setIsSwitchAccountModalOpen(true)}
                  className="bg-white text-[#00132d] px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex items-center space-x-2"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  <span>Switch Account</span>
                </button>

                {/* Settings Button */}
                <button
                  onClick={() => window.location.href = '/settings'}
                  className="bg-[#fff7d7] text-[#00132d] px-4 py-2 rounded-lg hover:bg-[#fff7d7]/70 transition-colors flex items-center space-x-2"
                >
                  <CogIcon className="h-5 w-5" />
                  <span>Settings</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className={`grid grid-cols-1 md:grid-cols-${(userProfile.stats.pendingFollowRequests || 0) > 0 ? '3' : '2'} gap-6 mb-6`}>
          <Link href="/profile/followers" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:border-[#00132d] transition-colors block">
            <div className="text-2xl font-bold text-[#00132d] mb-1">{userProfile.stats.followers}</div>
            <div className="text-sm text-gray-600">Followers</div>
          </Link>
          <Link href="/profile/following" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:border-[#00132d] transition-colors block">
            <div className="text-2xl font-bold text-[#00132d] mb-1">{userProfile.stats.following}</div>
            <div className="text-sm text-gray-600">Following</div>
          </Link>
          {(userProfile.stats.pendingFollowRequests || 0) > 0 && (
            <Link href="/profile/follow-requests" className="bg-white rounded-lg shadow-sm border-2 border-primary p-6 cursor-pointer hover:bg-primary/5 transition-colors block animate-pulse-subtle">
              <div className="text-2xl font-bold text-primary mb-1">{userProfile.stats.pendingFollowRequests}</div>
              <div className="text-sm text-primary font-medium">Follow Requests</div>
            </Link>
          )}
        </div>

        {/* Measurements & Sizes Section */}
        <div className="mb-6">
          <MeasurementsSection
            measurements={userProfile.measurements}
            onEdit={() => setShowMeasurementManager(true)}
            isEditing={isEditing}
          />
        </div>

        {/* Linked Entities Section */}
        {linkedEntities.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Linked Entities</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {linkedEntities.map((entity) => {
                const displayRoles = entity.isOwner
                  ? ['Owner', ...entity.roles.filter(r => r !== 'Owner')]
                  : entity.roles;

                const businessTypeLabels: Record<string, string> = {
                  brand: 'Brand',
                  store: 'Store',
                  non_profit: 'Non-Profit',
                  designer: 'Designer',
                  manufacturer: 'Manufacturer',
                  page: 'Page',
                  supplier: 'Supplier'
                };

                return (
                  <Link
                    key={entity.brandId}
                    href={`/${entity.businessType === 'store' ? 'stores' : entity.businessType === 'supplier' ? 'suppliers' : 'brands'}/${entity.brandSlug || entity.brandId}`}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:border-[#00132d] transition-colors flex items-start gap-4"
                  >
                    {/* Entity Logo */}
                    <div className="flex-shrink-0">
                      {entity.brandLogo ? (
                        <img
                          src={getImageUrl(entity.brandLogo)}
                          alt={entity.brandName}
                          className="w-14 h-14 rounded-lg object-cover border border-gray-100"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-[#00132d] to-[#1e3a5f] flex items-center justify-center">
                          <span className="text-[#fff7d7] text-xl font-bold">
                            {entity.brandName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Entity Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900 truncate">{entity.brandName}</h4>
                        {entity.verificationStatus === 'verified' && <VerifiedBadge size="xs" />}
                        <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                          {businessTypeLabels[entity.businessType] || entity.businessType}
                        </span>
                      </div>

                      <p className="text-sm text-gray-500 mt-0.5">
                        {entity.followersCount.toLocaleString()} follower{entity.followersCount !== 1 ? 's' : ''}
                      </p>

                      {/* Roles - only show title if no roles are selected */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {displayRoles.length > 0 ? (
                          displayRoles.map((role, idx) => (
                            <span
                              key={idx}
                              className={`px-2 py-0.5 text-xs rounded-full font-medium ${role === 'Owner'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                                }`}
                            >
                              {role}
                            </span>
                          ))
                        ) : entity.title ? (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700 font-medium">
                            {entity.title}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'wardrobe', name: 'Wardrobe' },
                { id: 'outfits', name: 'Outfits' },
                { id: 'likes', name: 'Liked Items' },
                { id: 'wishlists', name: 'Wishlists' },
                { id: 'activity', name: 'Activity' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                    ? 'border-[#00132d] text-[#00132d]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">

            {activeTab === 'wardrobe' && (
              <WardrobeTabContent
                wardrobeItems={wardrobeItems}
                wardrobeLoading={wardrobeLoading}
              />
            )}

            {activeTab === 'likes' && <LikedItemsTab />}
            {activeTab === 'wishlists' && <WishlistTab />}

            {activeTab !== 'wardrobe' && activeTab !== 'likes' && activeTab !== 'wishlists' && (
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h3>
                <p className="text-gray-600">This section is currently being developed.</p>
              </div>
            )}
          </div>
        </div>
      </main >

      {showCropper && (
        <ImageCropper
          key={cropperImageSrc}
          imageSrc={cropperImageSrc}
          aspectRatio={croppingMode === 'profile' ? 1 : 4} // 4:1 for banner
          cropShape={croppingMode === 'profile' ? 'round' : 'rect'}
          onCancel={() => {
            setShowCropper(false);
            setCropperImageSrc('');
            setPhotoQueue([]);
            setBannerQueue([]);
          }}
          onCropComplete={handleCropSave}
        />
      )}

      {/* Measurement Manager Modal */}
      <MeasurementManager
        isOpen={showMeasurementManager}
        onClose={() => setShowMeasurementManager(false)}
        initialMeasurements={userProfile?.measurements}
        onSave={async (measurements) => {
          await apiClient.updateProfile({ measurements });
          await loadProfile();
          setShowMeasurementManager(false);
        }}
      />

      <toast.ToastComponent />
    </div >
  );
}
