
import { useState, useEffect } from 'react';
import {
    PhotoIcon,
    LinkIcon,
    DocumentIcon,
    XMarkIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils';
import { apiClient } from '@/lib/api';

interface ConversationMediaPanelProps {
    conversationId: string;
    onClose: () => void;
}

type TabType = 'media' | 'links' | 'docs';

export default function ConversationMediaPanel({ conversationId, onClose }: ConversationMediaPanelProps) {
    const [activeTab, setActiveTab] = useState<TabType>('media');
    const [data, setData] = useState<{ media: any[], links: any[], docs: any[] }>({
        media: [],
        links: [],
        docs: []
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchMedia = async () => {
            setIsLoading(true);
            try {
                const mediaData = await apiClient.getConversationMedia(conversationId);
                setData(mediaData);
            } catch (error) {
                console.error('Failed to fetch media:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (conversationId) {
            fetchMedia();
        }
    }, [conversationId]);

    const tabs = [
        { id: 'media', label: 'Media', icon: PhotoIcon },
        { id: 'links', label: 'Links', icon: LinkIcon },
        { id: 'docs', label: 'Docs', icon: DocumentIcon },
    ];

    return (
        <div className="flex flex-col h-full bg-white border-l border-gray-100 w-80 shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="p-6 flex justify-between items-center border-b border-gray-50">
                <h3 className="text-sm font-black uppercase tracking-widest text-black">Shared Content</h3>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            <div className="flex border-b border-gray-50 px-2">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        className={`flex-1 py-4 flex flex-col items-center gap-1.5 transition-all relative
                            ${activeTab === tab.id ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'stroke-2' : ''}`} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{tab.label}</span>
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-4 right-4 h-1 bg-black rounded-t-full" />
                        )}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {isLoading ? (
                    <div className="flex items-center justify-center h-40">
                        <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
                        {activeTab === 'media' && (
                            <div className="grid grid-cols-3 gap-2">
                                {data.media.length > 0 ? (
                                    data.media.map(item => (
                                        <div key={item.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group cursor-pointer hover:ring-2 hover:ring-black transition-all">
                                            <Image
                                                src={getImageUrl(item.url)}
                                                alt={item.name}
                                                fill
                                                className="object-cover group-hover:scale-110 transition-transform"
                                            />
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-3 py-20 text-center">
                                        <PhotoIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No media shared yet</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'links' && (
                            <div className="space-y-3">
                                {data.links.length > 0 ? (
                                    data.links.map((link, idx) => (
                                        <a
                                            key={idx}
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center flex-shrink-0">
                                                    <LinkIcon className="w-4 h-4 text-black" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-black truncate group-hover:text-blue-600 transition-colors">{link.url}</p>
                                                    <p className="text-[9px] text-gray-500 font-bold uppercase mt-1">{new Date(link.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                <ChevronRightIcon className="w-3 h-3 text-gray-300 group-hover:text-black mt-1" />
                                            </div>
                                        </a>
                                    ))
                                ) : (
                                    <div className="py-20 text-center">
                                        <LinkIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No links shared yet</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'docs' && (
                            <div className="space-y-3">
                                {data.docs.length > 0 ? (
                                    data.docs.map(doc => (
                                        <div
                                            key={doc.id}
                                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer group"
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                                                <DocumentIcon className="w-5 h-5 text-red-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-black truncate">{doc.name}</p>
                                                <p className="text-[9px] text-gray-500 font-bold uppercase mt-0.5">
                                                    {(doc.size / 1024).toFixed(1)} KB • {new Date(doc.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <button className="text-[9px] font-black uppercase text-black bg-white px-2 py-1 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                                Download
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-20 text-center">
                                        <DocumentIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No documents shared yet</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
