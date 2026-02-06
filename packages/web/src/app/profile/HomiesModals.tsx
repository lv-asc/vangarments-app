'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { TrashIcon, UserPlusIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { getImageUrl } from '@/lib/utils';

// Local interface definitions to avoid import issues
interface HomiesList {
    id: string;
    userId: string;
    name: string;
    color: string;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
    memberCount?: number;
}

interface HomiesModalsProps {
    // Homies Management Modal
    isHomiesModalOpen: boolean;
    setIsHomiesModalOpen: (open: boolean) => void;
    editingHomiesList: HomiesList | null;
    handleCreateOrUpdateHomiesList: (name: string, color: string) => void;
    handleDeleteHomiesList: (id: string) => void;

    // Member Management
    homiesListMembers: any[];
    loadingHomiesMembers: boolean;
    setShowAddMemberModal: (show: boolean) => void;
    handleRemoveMemberFromList: (id: string) => void;

    // Add Member Modal
    showAddMemberModal: boolean;
    memberSearchQuery: string;
    handleMemberSearch: (query: string) => void;
    memberSearchResults: any[];
    searchingMembers: boolean;
    handleAddMemberToList: (member: any) => void;
}

export const HomiesModals: React.FC<HomiesModalsProps> = ({
    isHomiesModalOpen,
    setIsHomiesModalOpen,
    editingHomiesList,
    handleCreateOrUpdateHomiesList,
    handleDeleteHomiesList,
    homiesListMembers,
    loadingHomiesMembers,
    setShowAddMemberModal,
    handleRemoveMemberFromList,
    showAddMemberModal,
    memberSearchQuery,
    handleMemberSearch,
    memberSearchResults,
    searchingMembers,
    handleAddMemberToList,
}) => {
    return (
        <>
            {/* Homies Management Modal */}
            <Modal
                isOpen={isHomiesModalOpen}
                onClose={() => setIsHomiesModalOpen(false)}
                title={editingHomiesList ? `Manage ${editingHomiesList.name}` : 'Create New Homies List'}
                size="md"
            >
                <div className="space-y-6">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            handleCreateOrUpdateHomiesList(
                                formData.get('name') as string,
                                formData.get('color') as string
                            );
                        }}
                        className="space-y-4"
                    >
                        <div>
                            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
                                List Name
                                {editingHomiesList?.isDefault && (
                                    <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                )}
                            </label>
                            <input
                                name="name"
                                defaultValue={editingHomiesList?.name || ''}
                                required
                                disabled={editingHomiesList?.isDefault}
                                readOnly={editingHomiesList?.isDefault}
                                className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${editingHomiesList?.isDefault ? 'bg-gray-50 text-gray-400' : ''}`}
                                placeholder="e.g. Best Friends, Designers..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Badge Color</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    name="color"
                                    defaultValue={editingHomiesList?.color || '#000080'}
                                    disabled={editingHomiesList?.isDefault}
                                    className={`w-10 h-10 rounded cursor-pointer border-0 p-0 ${editingHomiesList?.isDefault ? 'opacity-50 cursor-not-allowed' : ''}`}
                                />
                                <span className="text-xs text-gray-500">
                                    {editingHomiesList?.isDefault ? 'Standard color for default list' : 'Choose a color for the badge'}
                                </span>
                            </div>
                        </div>
                        <div className="flex justify-between pt-2">
                            {editingHomiesList && !editingHomiesList.isDefault && (
                                <button
                                    type="button"
                                    onClick={() => handleDeleteHomiesList(editingHomiesList.id)}
                                    className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                    Delete List
                                </button>
                            )}
                            <div className="flex gap-2 ml-auto">
                                <button
                                    type="button"
                                    onClick={() => setIsHomiesModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editingHomiesList?.isDefault}
                                    className={`px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors ${editingHomiesList?.isDefault ? 'hidden' : ''}`}
                                >
                                    {editingHomiesList ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </div>
                    </form>

                    {editingHomiesList && (
                        <div className="border-t border-gray-100 pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-semibold text-gray-900">Members</h4>
                                <button
                                    onClick={() => setShowAddMemberModal(true)}
                                    className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                                >
                                    <UserPlusIcon className="w-4 h-4" />
                                    Add Friend
                                </button>
                            </div>

                            {loadingHomiesMembers ? (
                                <div className="flex justify-center py-4">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                                </div>
                            ) : homiesListMembers.length === 0 ? (
                                <p className="text-center py-4 text-gray-500 text-sm italic">No members yet.</p>
                            ) : (
                                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                    {homiesListMembers.map((user: any) => (
                                        <div key={user.id} className="flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100">
                                                    {user.personalInfo?.avatarUrl ? (
                                                        <img
                                                            src={getImageUrl(user.personalInfo.avatarUrl)}
                                                            alt={user.username || 'User'}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400">
                                                            {(user.personalInfo?.name || user.username || '?')[0].toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{user.personalInfo?.name || user.username}</p>
                                                    <p className="text-xs text-gray-500">@{user.username}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveMemberFromList(user.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                title="Remove member"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Modal>

            {/* Add Member Modal */}
            <Modal
                isOpen={showAddMemberModal}
                onClose={() => setShowAddMemberModal(false)}
                title="Add Friend to List"
                size="sm"
            >
                <div className="space-y-4">
                    <div className="relative">
                        <input
                            type="text"
                            value={memberSearchQuery}
                            onChange={(e) => handleMemberSearch(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Search by username or name..."
                            autoFocus
                        />
                        <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-2">
                        {searchingMembers ? (
                            <div className="flex justify-center py-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                            </div>
                        ) : memberSearchQuery.length < 2 ? (
                            <p className="text-center py-4 text-gray-500 text-xs">Type at least 2 characters to search...</p>
                        ) : memberSearchResults.length === 0 ? (
                            <p className="text-center py-4 text-gray-500 text-xs">No users found.</p>
                        ) : (
                            memberSearchResults.map(user => (
                                <button
                                    key={`${user.type}-${user.id}`}
                                    onClick={() => handleAddMemberToList(user)}
                                    disabled={homiesListMembers.some(m => m.id === user.id && (m.type || 'user') === (user.type || 'user'))}
                                    className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 border border-gray-100 shrink-0">
                                            {user.personalInfo?.avatarUrl ? (
                                                <img src={getImageUrl(user.personalInfo.avatarUrl)} alt={user.username} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400">
                                                    {(user.personalInfo?.name || user.username || '?')[0].toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-left min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium text-gray-900 truncate group-hover:text-indigo-600">
                                                    {user.personalInfo?.name || user.username}
                                                </p>
                                                {user.type && user.type !== 'user' && (
                                                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded capitalize border border-gray-200">
                                                        {user.type === 'non_profit' ? 'Non-Profit' : user.type}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                                        </div>
                                    </div>
                                    {homiesListMembers.some(m => m.id === user.id && (m.type || 'user') === (user.type || 'user')) ? (
                                        <span className="text-xs text-green-600 font-medium shrink-0">Already in list</span>
                                    ) : (
                                        <PlusIcon className="w-4 h-4 text-indigo-600 shrink-0" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </Modal>
        </>
    );
};
