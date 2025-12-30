import React, { useState, useEffect } from 'react';
import { brandApi, BrandTeamMember, BrandRole } from '@/lib/brandApi';
import api from '@/lib/api';
import {
    UserPlusIcon,
    TrashIcon,
    PencilIcon,
    CheckIcon,
    XMarkIcon,
    MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { getImageUrl } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

interface TeamManagementProps {
    brandId: string;
}

interface UserSearchResult {
    id: string;
    name: string;
    email: string;
    username: string;
    profilePicture?: string;
}

const BRAND_ROLES: BrandRole[] = ['CEO', 'CFO', 'Founder', 'CD', 'Marketing', 'Seller', 'Designer', 'Model', 'Ambassador', 'Other'];

export default function TeamManagement({ brandId }: TeamManagementProps) {
    const [members, setMembers] = useState<BrandTeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedMember, setSelectedMember] = useState<BrandTeamMember | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);

    // Form State
    const [roles, setRoles] = useState<BrandRole[]>([]);
    const [title, setTitle] = useState('');
    const [isPublic, setIsPublic] = useState(true);

    useEffect(() => {
        loadTeam();
    }, [brandId]);

    const loadTeam = async () => {
        try {
            setLoading(true);
            const team = await brandApi.getTeamMembers(brandId, false); // Fetch all members, not just public
            setMembers(team);
        } catch (error) {
            console.error('Failed to load team', error);
            toast.error('Failed to load team members');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        try {
            setSearching(true);
            // Assuming generic user search endpoint
            const data: any = await api.get(`/users?search=${encodeURIComponent(query)}&limit=5`);
            setSearchResults(data.users || data.data?.users || []);
        } catch (error) {
            console.error('Search failed', error);
        } finally {
            setSearching(false);
        }
    };

    const handleAddMember = async () => {
        if (!selectedUser) {
            toast.error('Please select a user');
            return;
        }

        if (roles.length === 0 && !title.trim()) {
            toast.error('Please select at least one role or provide a job title');
            return;
        }

        try {
            await brandApi.addTeamMember(brandId, {
                userId: selectedUser.id,
                roles,
                title,
                isPublic
            });
            toast.success('Team member added');
            setShowAddModal(false);
            resetForm();
            loadTeam();
        } catch (error: any) {
            toast.error(error.message || 'Failed to add member');
        }
    };

    const handleUpdateMember = async () => {
        if (!selectedMember) return;

        if (roles.length === 0 && !title.trim()) {
            toast.error('Please select at least one role or provide a job title');
            return;
        }

        try {
            await brandApi.updateTeamMember(brandId, selectedMember.id, {
                roles,
                title,
                isPublic
            });
            toast.success('Team member updated');
            setShowEditModal(false);
            resetForm();
            loadTeam();
        } catch (error: any) {
            toast.error(error.message || 'Failed to update member');
        }
    };

    const handleRemoveMember = (memberId: string) => {
        setMemberToDelete(memberId);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteMember = async () => {
        if (!memberToDelete) return;

        try {
            setIsDeleting(true);
            await brandApi.removeTeamMember(brandId, memberToDelete);
            toast.success('Team member removed');
            setIsDeleteModalOpen(false);
            setMemberToDelete(null);
            loadTeam();
        } catch (error: any) {
            toast.error(error.message || 'Failed to remove member');
        } finally {
            setIsDeleting(false);
        }
    };

    const resetForm = () => {
        setSelectedUser(null);
        setSearchQuery('');
        setSearchResults([]);
        setRoles([]);
        setTitle('');
        setIsPublic(true);
        setSelectedMember(null);
    };

    const openEditModal = (member: BrandTeamMember) => {
        setSelectedMember(member);

        let initialRoles: BrandRole[] = [];

        if (member.roles && Array.isArray(member.roles) && member.roles.length > 0) {
            initialRoles = member.roles;
        } else if ((member as any).role) {
            // Fallback for migration transition
            initialRoles = [(member as any).role];
        }

        // Filter out any invalid roles just in case
        initialRoles = initialRoles.filter(r => BRAND_ROLES.includes(r));

        console.log('Opening edit modal for:', member.id, 'Initial roles:', initialRoles);
        setRoles(initialRoles);
        setTitle(member.title || '');
        setIsPublic(member.isPublic);
        setShowEditModal(true);
    };

    const toggleRole = (role: BrandRole) => {
        if (roles.includes(role)) {
            setRoles(roles.filter(r => r !== role));
        } else {
            setRoles([...roles, role]);
        }
    };

    if (loading) return <div className="text-center py-10">Loading team...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Team Members</h3>
                <button
                    onClick={() => { resetForm(); setShowAddModal(true); }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                    <UserPlusIcon className="h-4 w-4 mr-2" />
                    Add Member
                </button>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                    {members.map((member) => (
                        <li key={member.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                    {member.user?.avatarUrl ? (
                                        <img className="h-10 w-10 rounded-full object-cover" src={getImageUrl(member.user.avatarUrl)} alt="" />
                                    ) : (
                                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                                            {member.user?.name?.charAt(0) || '?'}
                                        </div>
                                    )}
                                </div>
                                <div className="ml-4">
                                    <h4 className="text-sm font-medium text-gray-900">{member.user?.name || 'Unknown User'}</h4>
                                    <p className="text-sm text-gray-500">
                                        <span className="font-semibold">
                                            {member.roles?.join(', ') || (member as any).role}
                                        </span>
                                        {member.title && <span className="mx-1">•</span>}
                                        {member.title}
                                    </p>
                                    <p className="text-xs text-gray-400">@{member.user?.username}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className={`px-2 py-1 text-xs rounded-full ${member.isPublic ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {member.isPublic ? 'Public' : 'Private'}
                                </div>
                                <button
                                    onClick={() => openEditModal(member)}
                                    className="text-gray-400 hover:text-blue-600"
                                >
                                    <PencilIcon className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={() => handleRemoveMember(member.id)}
                                    className="text-gray-400 hover:text-red-600"
                                >
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            </div>
                        </li>
                    ))}
                    {members.length === 0 && (
                        <li className="px-4 py-8 text-center text-gray-500 text-sm">
                            No team members found. Add someone to get started.
                        </li>
                    )}
                </ul>
            </div>

            {/* Add Member Modal */}
            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Team Member">
                <div className="space-y-4">
                    {/* User Search */}
                    {!selectedUser ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Search User</label>
                            <div className="relative mt-1">
                                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="Search by name, username or email"
                                />
                            </div>
                            {searching && <p className="mt-2 text-sm text-gray-500">Searching...</p>}
                            {searchResults.length > 0 && (
                                <ul className="mt-2 border border-gray-200 rounded-md max-h-48 overflow-y-auto">
                                    {searchResults.map(user => (
                                        <li
                                            key={user.id}
                                            onClick={() => { setSelectedUser(user); setSearchResults([]); setSearchQuery(''); }}
                                            className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center"
                                        >
                                            <div className="h-8 w-8 rounded-full bg-gray-200 mr-3 overflow-hidden">
                                                {user.profilePicture && <img src={getImageUrl(user.profilePicture)} className="h-full w-full object-cover" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                                <p className="text-xs text-gray-500">@{user.username}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-md border border-blue-100">
                            <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-gray-200 mr-3 overflow-hidden">
                                    {selectedUser.profilePicture && <img src={getImageUrl(selectedUser.profilePicture)} className="h-full w-full object-cover" />}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{selectedUser.name}</p>
                                    <p className="text-xs text-gray-500">@{selectedUser.username}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600">
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>
                    )}

                    {/* Roles Checkboxes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Roles</label>
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1 border rounded-md border-gray-300 bg-gray-50">
                            {BRAND_ROLES.map(r => (
                                <label key={r} className="inline-flex items-center space-x-2 p-1 hover:bg-gray-100 rounded cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={roles.includes(r)}
                                        onChange={() => toggleRole(r)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="text-sm text-gray-900">{r}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {roles.length === 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Job Title (Required when no role selected)</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 border"
                                placeholder="e.g. Senior Designer"
                            />
                        </div>
                    )}

                    <div className="flex items-center">
                        <input
                            id="is-public"
                            type="checkbox"
                            checked={isPublic}
                            onChange={(e) => setIsPublic(e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="is-public" className="ml-2 block text-sm text-gray-900">
                            Publicly Visible
                        </label>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            onClick={() => setShowAddModal(false)}
                            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAddMember}
                            disabled={!selectedUser}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Add Member
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Edit Modal */}
            <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Team Member">
                <div className="space-y-4">
                    {/* Roles Checkboxes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Roles</label>
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1 border rounded-md border-gray-300 bg-gray-50">
                            {BRAND_ROLES.map(r => (
                                <label key={r} className="inline-flex items-center space-x-2 p-1 hover:bg-gray-100 rounded cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={roles.includes(r)}
                                        onChange={() => toggleRole(r)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="text-sm text-gray-900">{r}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {roles.length === 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Job Title (Required when no role selected)</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 border"
                            />
                        </div>
                    )}

                    <div className="flex items-center">
                        <input
                            id="edit-is-public"
                            type="checkbox"
                            checked={isPublic}
                            onChange={(e) => setIsPublic(e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="edit-is-public" className="ml-2 block text-sm text-gray-900">
                            Publicly Visible
                        </label>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            onClick={() => setShowEditModal(false)}
                            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUpdateMember}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </Modal>

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDeleteMember}
                title="Remove Team Member"
                message="Are you sure you want to remove this team member? This action cannot be undone."
                confirmText="Remove"
                variant="danger"
                isLoading={isDeleting}
            />
        </div>
    );
}
