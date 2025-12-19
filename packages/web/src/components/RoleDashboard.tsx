'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthWrapper';

interface RoleDashboardProps {
    title: string;
    roleId?: string;
}

export default function RoleDashboard({ title, roleId }: RoleDashboardProps) {
    const { activeRole } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-4xl w-full text-center">
                <h1 className="text-4xl font-bold mb-4 text-[#00132d]">{title} Dashboard</h1>
                <p className="text-xl text-gray-600 mb-8">
                    Welcome to your {title} Experience.
                </p>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-gray-500">This feature is under development.</p>
                    {roleId === activeRole && (
                        <div className="mt-4 p-4 bg-green-50 text-green-800 rounded-lg">
                            You are currently viewing as a {title}.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
