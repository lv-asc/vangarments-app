'use client';

import React, { useState, useEffect } from 'react';
import { sportOrgApi } from '@/lib/sportOrgApi';
import { TrophyIcon, GlobeAltIcon, BuildingOfficeIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { SportOrg, SportLeague } from '@vangarments/shared/types';
import toast from 'react-hot-toast';

export default function SportOrgsBrowseClient() {
    const [orgs, setOrgs] = useState<SportOrg[]>([]);
    const [leagues, setLeagues] = useState<SportLeague[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'clubs' | 'leagues'>('clubs');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [orgsRes, leaguesRes] = await Promise.all([
                sportOrgApi.listOrgs(),
                sportOrgApi.listLeagues()
            ]);
            setOrgs(orgsRes);
            setLeagues(leaguesRes);
        } catch (error) {
            toast.error('Failed to load sport data');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="bg-white border-b border-gray-100 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h1 className="text-4xl font-black text-gray-900 mb-4 uppercase tracking-tighter italic">
                            Explore Sport Ecosystem
                        </h1>
                        <p className="text-gray-500 max-w-2xl mx-auto font-medium">
                            Discover institutions, clubs, and professional leagues. Browse our curated collection of official sportswear and memorabilia.
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Tabs */}
                <div className="flex justify-center mb-12">
                    <div className="inline-flex p-1 bg-gray-100 rounded-xl">
                        <button
                            onClick={() => setActiveTab('clubs')}
                            className={`px-8 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'clubs' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Institutions
                        </button>
                        <button
                            onClick={() => setActiveTab('leagues')}
                            className={`px-8 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'leagues' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Leagues
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-64 bg-gray-200 rounded-2xl" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {activeTab === 'clubs' ? (
                            orgs.map(org => (
                                <Link
                                    key={org.id}
                                    href={`/sport-orgs/${org.slug}`}
                                    className="group bg-white rounded-2xl border border-gray-100 p-8 hover:shadow-xl transition-all hover:-translate-y-1"
                                >
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="h-16 w-16 bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden border">
                                            {org.masterLogo ? (
                                                <img src={org.masterLogo} alt={org.name} className="h-full w-full object-contain p-2" />
                                            ) : (
                                                <BuildingOfficeIcon className="h-8 w-8 text-gray-300" />
                                            )}
                                        </div>
                                        <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                                            {org.orgType.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-black text-gray-900 uppercase italic mb-2 group-hover:text-blue-600 transition-colors">
                                        {org.name}
                                    </h3>
                                    <p className="text-gray-500 text-sm mb-6 line-clamp-2">
                                        {org.description || 'Global sports institution focusing on elite competition and talent development.'}
                                    </p>
                                    <div className="flex items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                        <div className="flex items-center gap-1">
                                            <UserGroupIcon className="h-4 w-4" />
                                            <span>{org.departments?.length || 0} Depts</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <GlobeAltIcon className="h-4 w-4" />
                                            <span>{org.foundedCountry || 'INT'}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            leagues.map(league => (
                                <div
                                    key={league.id}
                                    className="group bg-white rounded-2xl border border-gray-100 p-8 hover:shadow-xl transition-all"
                                >
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="h-16 w-16 bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden border">
                                            {league.logo ? (
                                                <img src={league.logo} alt={league.name} className="h-full w-full object-contain p-2" />
                                            ) : (
                                                <TrophyIcon className="h-8 w-8 text-yellow-500" />
                                            )}
                                        </div>
                                        <span className="px-3 py-1 bg-yellow-50 text-yellow-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                                            {league.level || 'Official Concil'}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-black text-gray-900 uppercase italic mb-2">
                                        {league.name}
                                    </h3>
                                    <p className="text-gray-500 text-sm mb-6 uppercase tracking-widest font-bold">
                                        {league.sportType} competition
                                    </p>
                                    <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-50">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{league.country || 'Global'}</span>
                                        {league.website && (
                                            <a href={league.website} target="_blank" className="text-xs font-black text-blue-600 uppercase hover:underline">
                                                Visit Site →
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {!loading && (activeTab === 'clubs' ? orgs.length : leagues.length) === 0 && (
                    <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200">
                        <BuildingOfficeIcon className="h-16 w-16 mx-auto text-gray-200 mb-6" />
                        <h3 className="text-2xl font-black text-gray-900 uppercase italic mb-2">Nothing found</h3>
                        <p className="text-gray-400">Our sports directory is currently being populated. Check back soon.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
