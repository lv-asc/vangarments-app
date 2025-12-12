'use client';

import React from 'react';
import { getImageUrl } from '@/utils/imageUrl';

interface UserAvatarProps {
  user: {
    name: string;
    avatar?: string;
    email?: string;
    username?: string;
  };
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function UserAvatar({ user, size = 'md', className = '' }: UserAvatarProps) {
  const getInitials = (name: string): string => {
    const safeName = name || '';
    const words = safeName.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return safeName.slice(0, 2).toUpperCase();
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
  };

  const initials = getInitials(user.name);

  // Transform avatar URL through image proxy
  const avatarUrl = user.avatar ? getImageUrl(user.avatar) : null;

  if (avatarUrl && !avatarUrl.includes('placeholder')) {
    return (
      <img
        src={avatarUrl}
        alt={user.name}
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-[#00132d] text-[#fff7d7] flex items-center justify-center font-semibold ${className}`}
      title={user.name}
    >
      {initials}
    </div>
  );
}

interface UserDisplayProps {
  user: {
    name: string;
    email?: string;
    avatar?: string;
    username?: string;
  };
  showEmail?: boolean;
  showAvatar?: boolean;
  avatarSize?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function UserDisplay({
  user,
  showEmail = false,
  showAvatar = true,
  avatarSize = 'md',
  className = ''
}: UserDisplayProps) {
  // Use provided username or extract from email or use first name
  const getUsername = (name: string, email?: string, username?: string): string => {
    if (username) {
      return `@${username}`;
    }

    if (email) {
      const emailUsername = email.split('@')[0];
      // If email username is meaningful, use it
      if (emailUsername.length > 2 && !emailUsername.includes('.')) {
        return `@${emailUsername}`;
      }
    }

    // Otherwise use first name
    const firstName = name.split(' ')[0];
    return `@${firstName.toLowerCase()}`;
  };

  const username = getUsername(user.name, user.email, user.username);

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {showAvatar && (
        <UserAvatar user={user} size={avatarSize} />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium text-gray-900 truncate">
            {user.name}
          </p>
          <p className="text-sm text-gray-500 truncate">
            {username}
          </p>
        </div>
        {showEmail && user.email && (
          <p className="text-xs text-gray-400 truncate">
            {user.email}
          </p>
        )}
      </div>
    </div>
  );
}