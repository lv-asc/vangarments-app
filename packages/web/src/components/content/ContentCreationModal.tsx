'use client';

import React, { useState, useRef, useCallback } from 'react';
import { ContentType, AspectRatio, Visibility, useContent } from '@/contexts/ContentContext';
import { api } from '@/lib/api';

interface ContentCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: ContentType;
}

export function ContentCreationModal({ isOpen, onClose, defaultType = 'feed' }: ContentCreationModalProps) {
  const { createPost, createDraft } = useContent();

  const [step, setStep] = useState<'type' | 'media' | 'details'>('type');
  const [contentType, setContentType] = useState<ContentType>(defaultType);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get aspect ratio based on content type
  const getAspectRatio = (): AspectRatio => {
    if (contentType === 'daily' || contentType === 'motion') return '9:16';
    return '1:1';
  };

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate based on content type
    if (contentType !== 'feed' && files.length > 1) {
      setError('Daily and Motion posts can only have one media file');
      return;
    }

    if (contentType === 'motion') {
      const isVideo = files.every(f => f.type.startsWith('video/'));
      if (!isVideo) {
        setError('Motion posts must be videos');
        return;
      }
    }

    // Create previews
    const previews = files.map(file => URL.createObjectURL(file));

    setMediaFiles(files);
    setMediaPreviews(previews);
    setStep('details');
    setError(null);
  }, [contentType]);

  // Handle publish
  const handlePublish = async () => {
    if (mediaFiles.length === 0) {
      setError('Please select at least one media file');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Upload files to storage
      const uploadPromises = mediaFiles.map(file => api.uploadFile(file));
      const results = await Promise.all(uploadPromises);
      const mediaUrls = results.map(r => r.url);

      const mediaType = mediaFiles[0].type.startsWith('video/') ? 'video' : 'image';

      await createPost({
        contentType,
        mediaUrls,
        mediaType,
        title: title.trim() || undefined,
        caption: caption.trim() || undefined,
        aspectRatio: getAspectRatio(),
        visibility
      });

      // Clean up and close
      handleClose();
    } catch (err: any) {
      console.error('Publish error:', err);
      setError(err.message || 'Failed to create post');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle save to drafts
  const handleSaveDraft = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Upload files to storage if any
      let mediaUrls = mediaPreviews;

      if (mediaFiles.length > 0) {
        const uploadPromises = mediaFiles.map(file => api.uploadFile(file));
        const results = await Promise.all(uploadPromises);
        mediaUrls = results.map(r => r.url);
      }

      await createDraft({
        contentType,
        draftData: {
          title,
          caption,
          visibility,
          aspectRatio: getAspectRatio(),
          mediaType: mediaFiles[0]?.type.startsWith('video/') ? 'video' : 'image'
        },
        mediaUrls,
      });

      handleClose();
    } catch (err: any) {
      console.error('Draft error:', err);
      setError(err.message || 'Failed to save draft');
    } finally {
      setIsLoading(false);
    }
  };

  // Close and reset
  const handleClose = () => {
    setStep('type');
    setMediaFiles([]);
    setMediaPreviews([]);
    setTitle('');
    setCaption('');
    setVisibility('public');
    setError(null);
    onClose();
  };

  // Go back
  const handleBack = () => {
    if (step === 'details') {
      setStep('media');
    } else if (step === 'media') {
      setStep('type');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-5" onClick={handleClose}>
      <div
        className="w-full max-w-[500px] max-h-[90vh] bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 h-14 bg-white dark:bg-black z-10">
          {step !== 'type' ? (
            <button className="w-8 h-8 flex items-center justify-center text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors" onClick={handleBack}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
          ) : <div className="w-8" />}

          <h2 className="text-base font-semibold text-gray-900 dark:text-white flex-1 text-center">
            {step === 'type' && 'Create Post'}
            {step === 'media' && 'Add Media'}
            {step === 'details' && 'New ' + contentType.charAt(0).toUpperCase() + contentType.slice(1)}
          </h2>

          <button className="w-8 h-8 flex items-center justify-center text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors" onClick={handleClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 bg-white dark:bg-black">
          {/* Step 1: Select Type */}
          {step === 'type' && (
            <div className="flex flex-col gap-5">
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">What would you like to create?</p>

              <div className="flex flex-col gap-3">
                <TypeOption
                  type="daily"
                  title="Daily"
                  description="24-hour story visible to followers"
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  }
                  isSelected={contentType === 'daily'}
                  onClick={() => {
                    setContentType('daily');
                    setStep('media');
                  }}
                />

                <TypeOption
                  type="motion"
                  title="Motion"
                  description="Short-form video for discovery"
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  }
                  isSelected={contentType === 'motion'}
                  onClick={() => {
                    setContentType('motion');
                    setStep('media');
                  }}
                />

                <TypeOption
                  type="feed"
                  title="Feed Post"
                  description="Permanent gallery post"
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <line x1="3" y1="9" x2="21" y2="9" />
                      <line x1="9" y1="21" x2="9" y2="9" />
                    </svg>
                  }
                  isSelected={contentType === 'feed'}
                  onClick={() => {
                    setContentType('feed');
                    setStep('media');
                  }}
                />
              </div>
            </div>
          )}

          {/* Step 2: Add Media */}
          {step === 'media' && (
            <div className="flex items-center justify-center min-h-[300px]">
              <input
                ref={fileInputRef}
                type="file"
                accept={contentType === 'motion' ? 'video/*' : 'image/*,video/*'}
                multiple={contentType === 'feed'}
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />

              <div
                className={`border-2 border-dashed border-gray-200 dark:border-gray-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 rounded-xl flex flex-col items-center justify-center cursor-pointer p-10 transition-all ${getAspectRatio() === '9:16' ? 'w-[200px] aspect-[9/16]' : 'w-full max-w-[300px] aspect-square'
                  }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 text-gray-400 mb-3">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Tap to add {contentType === 'motion' ? 'video' : 'media'}</p>
                <span className="text-xs text-gray-500 text-center">
                  {contentType === 'feed'
                    ? 'Images or videos (square 1:1 or portrait 4:5)'
                    : 'Vertical format (9:16)'}
                </span>
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {step === 'details' && (
            <div className="flex flex-col gap-5">
              {/* Media preview */}
              <div className={`relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 mx-auto border border-gray-200 dark:border-gray-800 ${getAspectRatio() === '9:16' ? 'w-[150px] aspect-[9/16]' : 'w-[200px] aspect-square'
                }`}>
                {mediaFiles[0]?.type.startsWith('video/') ? (
                  <video src={mediaPreviews[0]} controls playsInline className="w-full h-full object-cover" />
                ) : (
                  <img src={mediaPreviews[0]} alt="Preview" className="w-full h-full object-cover" />
                )}
                {mediaPreviews.length > 1 && (
                  <span className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md bg-opacity-75 backdrop-blur-sm">
                    +{mediaPreviews.length - 1}
                  </span>
                )}
              </div>

              {/* Title and Caption */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 px-1">Title</label>
                  <input
                    type="text"
                    placeholder="Enter a title (optional)"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    maxLength={100}
                    className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-lg p-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-shadow"
                  />
                  <div className="flex justify-end px-1">
                    <span className="text-[10px] text-gray-400">{title.length}/100</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 px-1">Caption</label>
                  <textarea
                    placeholder="Write a caption..."
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                    rows={3}
                    maxLength={2200}
                    className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-lg p-3 text-sm text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-shadow"
                  />
                  <div className="flex justify-end px-1">
                    <span className="text-[10px] text-gray-400">{caption.length}/2200</span>
                  </div>
                </div>
              </div>

              {/* Visibility */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-900 dark:text-white">Who can see this?</label>
                <div className="flex gap-2">
                  {(['public', 'followers', 'private'] as Visibility[]).map(v => (
                    <button
                      key={v}
                      className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-medium border transition-colors ${visibility === v
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-gray-50 dark:bg-[#111] border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      onClick={() => setVisibility(v)}
                    >
                      {v.charAt(0).toUpperCase() + v.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-red-500 text-xs text-center">{error}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'details' && (
          <footer className="flex gap-3 p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
            <button
              className="flex-1 py-3 px-4 rounded-lg text-sm font-semibold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSaveDraft}
              disabled={isLoading}
            >
              Save to Drafts
            </button>
            <button
              className="flex-1 py-3 px-4 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-500/20"
              onClick={handlePublish}
              disabled={isLoading || mediaFiles.length === 0}
            >
              {isLoading ? 'Publishing...' : 'Publish'}
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}

interface TypeOptionProps {
  type: ContentType;
  title: string;
  description: string;
  icon: React.ReactNode;
  isSelected: boolean;
  onClick: () => void;
}

function TypeOption({ title, description, icon, isSelected, onClick }: TypeOptionProps) {
  return (
    <button
      className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all w-full group ${isSelected
        ? 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-500 shadow-sm'
        : 'bg-white dark:bg-[#111] border-gray-200 dark:border-gray-800 hover:border-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-900/50'
        }`}
      onClick={onClick}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600' : 'bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400 group-hover:text-indigo-500'
        }`}>
        <div className="w-6 h-6">
          {React.cloneElement(icon as React.ReactElement, { className: 'w-full h-full' })}
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        <span className="text-sm font-semibold text-gray-900 dark:text-white">{title}</span>
        <span className="text-xs text-gray-500">{description}</span>
      </div>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-gray-400">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </button>
  );
}

export default ContentCreationModal;
