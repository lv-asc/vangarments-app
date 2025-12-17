'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  brandApi,
  BrandFullProfile,
  BrandTeamMember,
  BrandLookbook,
  BrandCollection,
  BrandProfileData,
  BrandRole,
  CreateLookbookData,
  CreateCollectionData
} from '@/lib/brandApi';

// ============ TYPES & CONSTANTS ============

const ROLES: BrandRole[] = ['CEO', 'CFO', 'Founder', 'CD', 'Marketing', 'Seller', 'Designer', 'Model', 'Ambassador', 'Other'];
const COLLECTION_TYPES = ['Seasonal', 'Capsule', 'Collaboration', 'Limited', 'Core', 'Other'] as const;

// ============ MAIN PAGE COMPONENT ============

export default function BrandProfileEditPage() {
  const params = useParams();
  const router = useRouter();
  const brandId = params.id as string;

  const [profile, setProfile] = useState<BrandFullProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'team' | 'lookbooks' | 'collections'>('overview');
  const [saving, setSaving] = useState(false);

  // Form States
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (brandId) {
      loadProfile();
    }
  }, [brandId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await brandApi.getFullProfile(brandId);
      setProfile(data);
      initializeFormData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load brand profile');
    } finally {
      setLoading(false);
    }
  };

  const initializeFormData = (data: BrandFullProfile) => {
    setFormData({
      // Brand Info
      name: data.brand.brandInfo.name,
      description: data.brand.brandInfo.description || '',
      website: data.brand.brandInfo.website || '',
      logo: data.brand.brandInfo.logo || '',
      banner: data.brand.brandInfo.banner || '',

      // Profile Data
      bio: data.brand.profileData?.bio || '',
      foundedDate: data.brand.profileData?.foundedDate || '',
      instagram: data.brand.profileData?.instagram || '',
      tiktok: data.brand.profileData?.tiktok || '',
      youtube: data.brand.profileData?.youtube || '',
      additionalLogos: data.brand.profileData?.additionalLogos || [],
    });
  };

  const handleSaveOverview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);

      // 1. Update basic brand info
      await brandApi.updateBrandAccount({
        brandInfo: {
          name: formData.name,
          description: formData.description,
          website: formData.website,
          logo: formData.logo, // Note: In real app, this should be merged deeply or handled carefully
          // simplified for this demo
          contactInfo: profile?.brand.brandInfo.contactInfo
        } as any // leveraging partial updates effectively
      });

      // 2. Update profile data
      await brandApi.updateProfileData(brandId, {
        bio: formData.bio,
        foundedDate: formData.foundedDate,
        instagram: formData.instagram,
        tiktok: formData.tiktok,
        youtube: formData.youtube,
        additionalLogos: formData.additionalLogos
      });

      alert('Profile updated successfully!');
      loadProfile(); // Reload to get fresh data
    } catch (err: any) {
      alert(`Failed to update profile: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (loading) return <LoadingSpinner />;

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Brand Profile Not Found</h2>
          <p className="text-gray-500 mb-6">{error || 'The brand profile could not be loaded. It may not exist yet or has been deleted.'}</p>
          <div className="flex flex-col gap-3">
            <Link
              href="/admin/brands"
              className="inline-flex justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Return to Brands List
            </Link>
            {/* Optional: Add create link if we have context */}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/brands/${brandId}`} className="text-gray-500 hover:text-gray-700">
                ← Back to Profile
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Edit Brand Profile</h1>
            </div>
            <a
              href={`/brands/${brandId}`}
              target="_blank"
              className="text-blue-600 hover:underline text-sm flex items-center gap-1"
            >
              View Public Page ↗
            </a>
          </div>

          {/* Tabs */}
          <div className="flex gap-8 mt-6">
            {(['overview', 'team', 'lookbooks', 'collections'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <OverviewTab
            formData={formData}
            setFormData={setFormData}
            onSave={handleSaveOverview}
            saving={saving}
          />
        )}
        {activeTab === 'team' && (
          <TeamTab
            brandId={brandId}
            initialMembers={profile.team}
            onUpdate={loadProfile}
          />
        )}
        {activeTab === 'lookbooks' && (
          <LookbooksTab
            brandId={brandId}
            initialLookbooks={profile.lookbooks}
            onUpdate={loadProfile}
          />
        )}
        {activeTab === 'collections' && (
          <CollectionsTab
            brandId={brandId}
            initialCollections={profile.collections}
            onUpdate={loadProfile}
          />
        )}
      </div>
    </div>
  );
}

// ============ TAB COMPONENTS ============

function OverviewTab({ formData, setFormData, onSave, saving }: any) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleLogoAdd = () => {
    const url = prompt('Enter logo URL:');
    if (url) {
      setFormData((prev: any) => ({
        ...prev,
        additionalLogos: [...(prev.additionalLogos || []), url]
      }));
    }
  };

  const handleLogoRemove = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      additionalLogos: prev.additionalLogos.filter((_: any, i: number) => i !== index)
    }));
  };

  return (
    <form onSubmit={onSave} className="space-y-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Basic Info</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label="Brand Name" name="name" value={formData.name} onChange={handleChange} required />
          <Input label="Website" name="website" value={formData.website} onChange={handleChange} placeholder="https://..." />
          <Input label="Founded Date" name="foundedDate" type="date" value={formData.foundedDate ? new Date(formData.foundedDate).toISOString().split('T')[0] : ''} onChange={handleChange} />
        </div>

        <TextArea label="Short Description (Meta)" name="description" value={formData.description} onChange={handleChange} rows={2} />
        <TextArea label="Brand Bio (Full)" name="bio" value={formData.bio} onChange={handleChange} rows={4} />
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Visual Identity</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label="Main Logo URL" name="logo" value={formData.logo} onChange={handleChange} />
          <Input label="Banner Image URL" name="banner" value={formData.banner} onChange={handleChange} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Additional Logos / Assets</label>
          <div className="flex flex-wrap gap-4 mb-3">
            {formData.additionalLogos?.map((logo: string, idx: number) => (
              <div key={idx} className="relative w-20 h-20 bg-gray-100 rounded border flex items-center justify-center p-1 group">
                <img src={logo} alt="Asset" className="w-full h-full object-contain" />
                <button
                  type="button"
                  onClick={() => handleLogoRemove(idx)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleLogoAdd}
              className="w-20 h-20 bg-gray-50 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-colors"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Social Media</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Input label="Instagram Handle/URL" name="instagram" value={formData.instagram} onChange={handleChange} placeholder="@username" />
          <Input label="TikTok Handle/URL" name="tiktok" value={formData.tiktok} onChange={handleChange} placeholder="@username" />
          <Input label="YouTube Handle/URL" name="youtube" value={formData.youtube} onChange={handleChange} placeholder="@channel" />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

function TeamTab({ brandId, initialMembers, onUpdate }: { brandId: string, initialMembers: BrandTeamMember[], onUpdate: () => void }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newMember, setNewMember] = useState({ userId: '', role: 'Other' as BrandRole, title: '', isPublic: true });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await brandApi.addTeamMember(brandId, {
        userId: newMember.userId,
        roles: [newMember.role],
        title: newMember.title,
        isPublic: newMember.isPublic
      });
      setIsAdding(false);
      setNewMember({ userId: '', role: 'Other', title: '', isPublic: true });
      onUpdate();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await brandApi.removeTeamMember(brandId, memberId);
      onUpdate();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Team Members</h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
        >
          {isAdding ? 'Cancel' : 'Add Member'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-white p-6 rounded-lg shadow mb-6 border border-blue-100">
          <h3 className="text-lg font-medium mb-4">Add New Team Member</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Input label="User ID (UUID)" value={newMember.userId} onChange={(e: any) => setNewMember({ ...newMember, userId: e.target.value })} required />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={newMember.role}
                onChange={(e: any) => setNewMember({ ...newMember, role: e.target.value as BrandRole })}
              >
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <Input label="Custom Title (Optional)" value={newMember.title} onChange={(e: any) => setNewMember({ ...newMember, title: e.target.value })} />
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={newMember.isPublic} onChange={(e: any) => setNewMember({ ...newMember, isPublic: e.target.checked })} />
                <span className="text-sm text-gray-700">Show publicly</span>
              </label>
            </div>
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Add Member</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {initialMembers.map(member => (
          <div key={member.id} className="bg-white p-4 rounded-lg shadow border border-gray-200 flex justify-between items-start">
            <div>
              <div className="font-medium text-gray-900">{member.user?.name || member.userId}</div>
              <div className="text-sm text-blue-600">{member.roles?.join(', ')}</div>
              {member.title && <div className="text-xs text-gray-500">{member.title}</div>}
              {!member.isPublic && <div className="text-xs text-red-500 mt-1">Hidden from profile</div>}
            </div>
            <button onClick={() => handleRemove(member.id)} className="text-red-600 hover:text-red-800 text-sm">Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function LookbooksTab({ brandId, initialLookbooks, onUpdate }: { brandId: string, initialLookbooks: BrandLookbook[], onUpdate: () => void }) {
  const [editing, setEditing] = useState<Partial<CreateLookbookData> | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await brandApi.updateLookbook(brandId, editId, editing as any);
      } else {
        await brandApi.createLookbook(brandId, editing as CreateLookbookData);
      }
      setEditing(null);
      setEditId(null);
      onUpdate();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this lookbook?')) return;
    try {
      await brandApi.deleteLookbook(brandId, id);
      onUpdate();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Lookbooks</h2>
        <button
          onClick={() => { setEditing({}); setEditId(null); }}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
        >
          Create Lookbook
        </button>
      </div>

      {editing && (
        <form onSubmit={handleSave} className="bg-white p-6 rounded-lg shadow mb-6 border border-blue-100">
          <h3 className="text-lg font-medium mb-4">{editId ? 'Edit Lookbook' : 'New Lookbook'}</h3>
          <div className="space-y-4">
            <Input label="Name" value={editing.name || ''} onChange={(e: any) => setEditing({ ...editing, name: e.target.value })} required />
            <TextArea label="Description" value={editing.description || ''} onChange={(e: any) => setEditing({ ...editing, description: e.target.value })} />
            <Input label="Cover Image URL" value={editing.coverImageUrl || ''} onChange={(e: any) => setEditing({ ...editing, coverImageUrl: e.target.value })} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Season" value={editing.season || ''} onChange={(e: any) => setEditing({ ...editing, season: e.target.value })} />
              <Input label="Year" type="number" value={editing.year || ''} onChange={(e: any) => setEditing({ ...editing, year: parseInt(e.target.value) })} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
            <button type="button" onClick={() => setEditing(null)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {initialLookbooks.map(lb => (
          <div key={lb.id} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="h-40 bg-gray-100">
              {lb.coverImageUrl && <img src={lb.coverImageUrl} className="w-full h-full object-cover" />}
            </div>
            <div className="p-4">
              <h3 className="font-bold">{lb.name}</h3>
              <p className="text-sm text-gray-500">{lb.season} {lb.year}</p>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => { setEditing(lb); setEditId(lb.id); }} className="text-blue-600 text-sm">Edit</button>
                <button onClick={() => handleDelete(lb.id)} className="text-red-600 text-sm">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CollectionsTab({ brandId, initialCollections, onUpdate }: { brandId: string, initialCollections: BrandCollection[], onUpdate: () => void }) {
  const [editing, setEditing] = useState<Partial<CreateCollectionData> | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await brandApi.updateCollection(brandId, editId, editing as any);
      } else {
        await brandApi.createCollection(brandId, editing as CreateCollectionData);
      }
      setEditing(null);
      setEditId(null);
      onUpdate();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this collection?')) return;
    try {
      await brandApi.deleteCollection(brandId, id);
      onUpdate();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Collections</h2>
        <button
          onClick={() => { setEditing({}); setEditId(null); }}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
        >
          Create Collection
        </button>
      </div>

      {editing && (
        <form onSubmit={handleSave} className="bg-white p-6 rounded-lg shadow mb-6 border border-blue-100">
          <h3 className="text-lg font-medium mb-4">{editId ? 'Edit Collection' : 'New Collection'}</h3>
          <div className="space-y-4">
            <Input label="Name" value={editing.name || ''} onChange={(e: any) => setEditing({ ...editing, name: e.target.value })} required />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={editing.collectionType || ''}
                onChange={(e: any) => setEditing({ ...editing, collectionType: e.target.value as any })}
              >
                <option value="">Select Type</option>
                {COLLECTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <TextArea label="Description" value={editing.description || ''} onChange={(e: any) => setEditing({ ...editing, description: e.target.value })} />
            <Input label="Cover Image URL" value={editing.coverImageUrl || ''} onChange={(e: any) => setEditing({ ...editing, coverImageUrl: e.target.value })} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Season" value={editing.season || ''} onChange={(e: any) => setEditing({ ...editing, season: e.target.value })} />
              <Input label="Year" type="number" value={editing.year || ''} onChange={(e: any) => setEditing({ ...editing, year: parseInt(e.target.value) })} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
            <button type="button" onClick={() => setEditing(null)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {initialCollections.map(c => (
          <div key={c.id} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="h-40 bg-gray-100">
              {c.coverImageUrl && <img src={c.coverImageUrl} className="w-full h-full object-cover" />}
            </div>
            <div className="p-4">
              <h3 className="font-bold">{c.name}</h3>
              <div className="text-xs inline-block bg-gray-100 px-2 py-0.5 rounded mt-1 mb-1">{c.collectionType}</div>
              <p className="text-sm text-gray-500">{c.season} {c.year}</p>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => { setEditing(c); setEditId(c.id); }} className="text-blue-600 text-sm">Edit</button>
                <button onClick={() => handleDelete(c.id)} className="text-red-600 text-sm">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ UTILS & UI COMPONENTS ============

function Input({ label, ...props }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
        {...props}
      />
    </div>
  );
}

function TextArea({ label, ...props }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea
        className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
        {...props}
      />
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    </div>
  );
}

function ErrorDisplay({ error }: { error: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center text-red-600">
        <h2 className="text-xl font-bold mb-2">Error</h2>
        <p>{error}</p>
      </div>
    </div>
  );
}
