'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { sportOrgApi } from '@/lib/sportOrgApi';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    TrashIcon,
    ChevronRightIcon,
    ChevronDownIcon,
    TrophyIcon,
} from '@heroicons/react/20/solid';
import {
    BuildingOfficeIcon,
    UserGroupIcon,
    PencilSquareIcon,
    Bars3Icon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { SPORT_ORG_TYPES } from '@vangarments/shared/constants';
import { SportOrg, SportOrgType, SportLeague } from '@vangarments/shared/types';
import BulkActionsBar from '@/components/admin/BulkActionsBar';
import { useMultiSelect } from '@/hooks/useMultiSelect';
import OrgTreeView from './components/OrgTreeView';
import OrgModal from './components/OrgModal';
import LeagueModal from './components/LeagueModal';

export default function SportOrgsClient() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [orgs, setOrgs] = useState<SportOrg[]>([]);
    const [loading, setLoading] = useState(true);

    // UI State
    const [activeTab, setActiveTab] = useState<'hierarchy' | 'leagues'>('hierarchy');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState<SportOrgType | ''>('');
    const [leagues, setLeagues] = useState<SportLeague[]>([]);

    // Modals
    const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
    const [editingOrg, setEditingOrg] = useState<SportOrg | undefined>(undefined);
    const [isLeagueModalOpen, setIsLeagueModalOpen] = useState(false);
    const [editingLeague, setEditingLeague] = useState<SportLeague | undefined>(undefined);

    useEffect(() => {
        if (!authLoading && (!user || !user.roles?.includes('admin'))) {
            router.push('/');
            return;
        }

        if (user?.roles?.includes('admin')) {
            if (activeTab === 'hierarchy') {
                fetchOrgs();
            } else {
                fetchLeagues();
            }
        }
    }, [user, authLoading, router, activeTab]);

    const fetchOrgs = async () => {
        try {
            setLoading(true);
            const response = await sportOrgApi.listOrgs({
                orgType: selectedType || undefined,
                search: searchTerm || undefined
            });
            console.log('[SportOrgsClient] fetchOrgs response:', response);
            setOrgs(Array.isArray(response) ? response : (response as any).data || []);
        } catch (error) {
            console.error('Failed to fetch sport orgs', error);
            toast.error('Failed to load organizations');
        } finally {
            setLoading(false);
        }
    };

    const fetchLeagues = async () => {
        try {
            setLoading(true);
            const response = await sportOrgApi.listLeagues({
                search: searchTerm || undefined
            });
            console.log('[SportOrgsClient] fetchLeagues response:', response);
            setLeagues(Array.isArray(response) ? response : (response as any).data || []);
        } catch (error) {
            toast.error('Failed to load leagues');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (org?: SportOrg) => {
        setEditingOrg(org);
        setIsOrgModalOpen(true);
    };

    if (authLoading || (loading && (!orgs || !orgs.length))) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <TrophyIcon className="h-8 w-8 text-yellow-500" />
                        Sport ORG Management
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Manage Clubs, Departments, and Squads hierarchy.
                    </p>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setActiveTab('hierarchy')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'hierarchy' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        Hierarchy
                    </button>
                    <button
                        onClick={() => setActiveTab('leagues')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'leagues' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        Leagues
                    </button>
                    <div className="w-px bg-gray-200 mx-2" />
                    {activeTab === 'hierarchy' ? (
                        <Link
                            href="/admin/sport-orgs/new"
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                        >
                            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                            New Organization
                        </Link>
                    ) : (
                        <button
                            onClick={() => setIsLeagueModalOpen(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                        >
                            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                            New League
                        </button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white shadow rounded-lg p-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder={activeTab === 'hierarchy' ? "Search organizations..." : "Search leagues..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (activeTab === 'hierarchy' ? fetchOrgs() : fetchLeagues())}
                            className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                        />
                    </div>
                    {activeTab === 'hierarchy' && (
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value as SportOrgType | '')}
                            className="block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 min-w-[200px]"
                        >
                            <option value="">All Org Types</option>
                            {SPORT_ORG_TYPES.map(type => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>
                    )}
                    <button
                        onClick={activeTab === 'hierarchy' ? fetchOrgs : fetchLeagues}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition-colors"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>

            {/* List / Tree View */}
            {activeTab === 'hierarchy' ? (
                <div className="space-y-4">
                    {orgs && orgs.length > 0 ? (
                        orgs.map(org => (
                            <OrgTreeView
                                key={org.id}
                                org={org}
                                onEdit={() => router.push(`/admin/sport-orgs/${org.id}`)}
                                onRefresh={fetchOrgs}
                            />
                        ))
                    ) : (
                        <div className="bg-white shadow rounded-lg p-12 text-center text-gray-500">
                            <BuildingOfficeIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                            <p>No organizations found.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul role="list" className="divide-y divide-gray-200">
                        {leagues && leagues.map((league) => (
                            <li key={league.id}>
                                <div className="px-4 py-4 flex items-center sm:px-6 hover:bg-gray-50">
                                    <div className="flex-1 min-w-0 flex items-center">
                                        <div className="flex-shrink-0">
                                            {league.logo ? (
                                                <img className="h-12 w-12 rounded-lg object-contain bg-white border" src={league.logo} alt="" />
                                            ) : (
                                                <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
                                                    <TrophyIcon className="h-6 w-6 text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="ml-4 flex-1">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-bold text-blue-600 truncate">{league.name}</p>
                                                <div className="ml-2 flex flex-shrink-0">
                                                    <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                        {league.level}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
                                                <span className="uppercase font-bold text-gray-400">{league.sportType}</span>
                                                {league.country && <span>{league.country}</span>}
                                                {league.website && <a href={league.website} target="_blank" className="text-blue-500 hover:underline">Website</a>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ml-5 flex-shrink-0">
                                        <button
                                            onClick={() => { setEditingLeague(league); setIsLeagueModalOpen(true); }}
                                            className="p-1 text-gray-400 hover:text-blue-600"
                                        >
                                            <PencilSquareIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                        {(!leagues || leagues.length === 0) && (
                            <li className="px-4 py-12 text-center text-gray-500">
                                <TrophyIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                                <p>No leagues found. Create one to get started.</p>
                            </li>
                        )}
                    </ul>
                </div>
            )}

            {/* Modal */}
            {isLeagueModalOpen && (
                <LeagueModal
                    league={editingLeague}
                    onClose={() => { setIsLeagueModalOpen(false); setEditingLeague(undefined); }}
                    onSuccess={() => {
                        setIsLeagueModalOpen(false);
                        setEditingLeague(undefined);
                        fetchLeagues();
                    }}
                />
            )}
        </div>
    );
}
