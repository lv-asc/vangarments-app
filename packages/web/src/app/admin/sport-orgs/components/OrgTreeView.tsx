'use client';

import React, { useState } from 'react';
import { SportOrg, SportDepartment, SportSquad } from '@vangarments/shared/types';
import {
    ChevronRightIcon,
    ChevronDownIcon,
    BuildingOfficeIcon,
    UserGroupIcon,
    PencilSquareIcon,
    PlusIcon,
    MapPinIcon
} from '@heroicons/react/20/solid';
import { sportOrgApi } from '@/lib/sportOrgApi';
import toast from 'react-hot-toast';
import DepartmentModal from './DepartmentModal';
import SquadModal from './SquadModal';
import QuickAddModal from './QuickAddModal';

interface OrgTreeViewProps {
    org: SportOrg;
    onEdit: () => void;
    onRefresh: () => void;
}

export default function OrgTreeView({ org, onEdit, onRefresh }: OrgTreeViewProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [departments, setDepartments] = useState<SportDepartment[]>([]);
    const [loading, setLoading] = useState(false);

    // Nested Modals
    const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
    const [isSquadModalOpen, setIsSquadModalOpen] = useState(false);
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);

    const toggleExpand = async () => {
        if (!isExpanded && departments.length === 0) {
            await fetchDetails();
        }
        setIsExpanded(!isExpanded);
    };

    const fetchDetails = async () => {
        try {
            setLoading(true);
            const response = await sportOrgApi.getOrg(org.id);
            // The API returns the org with departments and squads nested
            setDepartments((response as any).departments || []);
        } catch (error) {
            toast.error('Failed to load details');
        } finally {
            setLoading(false);
        }
    };

    const handleAddDept = () => {
        setIsDeptModalOpen(true);
    };

    const handleAddSquad = (deptId: string) => {
        setSelectedDeptId(deptId);
        setIsSquadModalOpen(true);
    };

    const handleQuickAdd = (deptId: string) => {
        setSelectedDeptId(deptId);
        setIsQuickAddOpen(true);
    }

    return (
        <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-100">
            {/* Org Header */}
            <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors" onClick={toggleExpand}>
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-50 rounded-lg">
                        {org.masterLogo ? (
                            <img src={org.masterLogo} alt={org.name} className="h-10 w-10 object-contain" />
                        ) : (
                            <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
                        )}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">{org.name}</h3>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="uppercase tracking-wider font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                                {org.orgType.replace(/_/g, ' ')}
                            </span>
                            {org.foundedCountry && (
                                <span className="flex items-center gap-1">
                                    <MapPinIcon className="h-3 w-3" />
                                    {org.foundedCountry}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(); }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                        <PencilSquareIcon className="h-5 w-5" />
                    </button>
                    {isExpanded ? (
                        <ChevronDownIcon className="h-6 w-6 text-gray-400" />
                    ) : (
                        <ChevronRightIcon className="h-6 w-6 text-gray-400" />
                    )}
                </div>
            </div>

            {/* Departments & Squads */}
            {isExpanded && (
                <div className="bg-gray-50 border-t border-gray-100 px-6 py-6 space-y-6">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Departments</h4>
                        <button
                            onClick={handleAddDept}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                            <PlusIcon className="h-3 w-3" /> Add Department
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : departments.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {departments.map(dept => (
                                <div key={dept.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                                                {dept.logo ? <img src={dept.logo} className="object-contain" /> : <TrophyIcon className="h-5 w-5 text-gray-400" />}
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-gray-800">{dept.name}</h5>
                                                <p className="text-xs text-blue-600 font-medium uppercase">{dept.sportType}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => handleQuickAdd(dept.id)}
                                                className="p-1 text-gray-400 hover:text-green-600" title="Quick Add Squads"
                                            >
                                                <PlusIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-gray-400 uppercase">Squads</span>
                                            <button onClick={() => handleAddSquad(dept.id)} className="text-[10px] text-blue-600 hover:underline">Manual Add</button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {dept.squads && dept.squads.length > 0 ? (
                                                dept.squads.map(squad => (
                                                    <div key={squad.id} className="px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs text-gray-700 flex items-center gap-1 group">
                                                        <UserGroupIcon className="h-3 w-3 text-gray-400" />
                                                        {squad.name}
                                                    </div>
                                                ))
                                            ) : (
                                                <span className="text-[11px] text-gray-400 italic">No squads created</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
                            <p className="text-sm text-gray-400">No departments found for this organization.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Modals */}
            {isDeptModalOpen && (
                <DepartmentModal
                    orgId={org.id}
                    onClose={() => setIsDeptModalOpen(false)}
                    onSuccess={() => { setIsDeptModalOpen(false); fetchDetails(); }}
                />
            )}
            {isSquadModalOpen && selectedDeptId && (
                <SquadModal
                    orgId={org.id}
                    deptId={selectedDeptId}
                    onClose={() => { setIsSquadModalOpen(false); setSelectedDeptId(null); }}
                    onSuccess={() => { setIsSquadModalOpen(false); setSelectedDeptId(null); fetchDetails(); }}
                />
            )}
            {isQuickAddOpen && selectedDeptId && (
                <QuickAddModal
                    orgId={org.id}
                    deptId={selectedDeptId}
                    onClose={() => { setIsQuickAddOpen(false); setSelectedDeptId(null); }}
                    onSuccess={() => { setIsQuickAddOpen(false); setSelectedDeptId(null); fetchDetails(); }}
                />
            )}
        </div>
    );
}

function TrophyIcon(props: any) {
    return (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
    );
}
