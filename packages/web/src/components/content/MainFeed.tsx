'use client';

import React, { useState } from 'react';
import { useContent } from '@/contexts/ContentContext';
import {
    DailyStoriesBar,
    DailyStoryViewer,
    MotionFeed,
    FeedGallery,
    ContentCreationModal
} from '@/components/content';
import { PlusIcon, VideoCameraIcon, PhotoIcon } from '@heroicons/react/24/outline';

export function MainFeed() {
    const [activeTab, setActiveTab] = useState<'feed' | 'motion'>('feed');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createType, setCreateType] = useState<'daily' | 'motion' | 'feed'>('feed');
    const { activeStoryIndex } = useContent();

    const handleCreateClick = (type: 'daily' | 'motion' | 'feed') => {
        setCreateType(type);
        setIsCreateModalOpen(true);
    };

    return (
        <div className="container mx-auto max-w-4xl pb-20 pt-6 px-4">
            {/* Header / Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8 sticky top-20 z-30">
                <div className="border-b border-gray-200 flex justify-between items-center pr-4">
                    <nav className="flex space-x-8 px-6">
                        <button
                            onClick={() => setActiveTab('feed')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'feed'
                                ? 'border-[#00132d] text-[#00132d]'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Following
                        </button>
                        <button
                            onClick={() => setActiveTab('motion')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'motion'
                                ? 'border-[#00132d] text-[#00132d]'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <VideoCameraIcon className="w-4 h-4" />
                            Motion
                        </button>
                    </nav>

                    <button
                        onClick={() => handleCreateClick(activeTab === 'motion' ? 'motion' : 'feed')}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#00132d] text-white text-xs font-bold uppercase tracking-wider rounded-md hover:bg-[#00132d]/90 transition-colors"
                    >
                        <PlusIcon className="w-4 h-4" />
                        <span>Create</span>
                    </button>
                </div>
            </div>

            {/* Daily Stories (Only on Feed tab) */}
            {activeTab === 'feed' && (
                <div className="mb-8">
                    <div className="px-1 mb-4 flex items-center gap-2">
                        <div className="h-4 w-1 bg-[#00132d] rounded-full"></div>
                        <h3 className="text-lg font-bold text-[#00132d]">Stories</h3>
                    </div>
                    <DailyStoriesBar onAddStory={() => handleCreateClick('daily')} />
                </div>
            )}

            {/* Main Content */}
            <div className="min-h-[50vh]">
                {activeTab === 'feed' ? (
                    <FeedGallery />
                ) : (
                    <div className="h-[calc(100vh-200px)] w-full rounded-xl overflow-hidden bg-black shadow-lg border border-gray-800">
                        <MotionFeed />
                    </div>
                )}
            </div>

            {/* Modals & Overlays */}
            <ContentCreationModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                defaultType={createType}
            />

            {activeStoryIndex !== null && <DailyStoryViewer />}
        </div>
    );
}
