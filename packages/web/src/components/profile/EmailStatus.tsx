'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthWrapper';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { EnvelopeIcon, CheckBadgeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export function EmailStatus() {
    const { user } = useAuth();
    const [isResending, setIsResending] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    // Cooldown timer effect
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    if (!user) return null;

    const isVerified = (user as any).emailVerified !== false; // Default to true for legacy/OAuth

    const handleResend = async () => {
        if (cooldown > 0) return;

        setIsResending(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
            const response = await fetch(`${apiUrl}/auth/resend-verification`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: user.email }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error?.message || 'Failed to resend');

            toast.success('Verification email sent! Please check your inbox.');
            setCooldown(60); // Set 60 seconds cooldown
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
            <div className="flex items-start justify-between">
                <div className="flex space-x-4">
                    <div className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full ${isVerified ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'}`}>
                        <EnvelopeIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Email Address</h3>
                        <p className="text-gray-500 dark:text-gray-400">{user.email}</p>

                        <div className="mt-2 flex items-center">
                            {isVerified ? (
                                <div className="flex items-center text-green-600 dark:text-green-400 text-sm font-medium">
                                    <CheckBadgeIcon className="w-4 h-4 mr-1.5" />
                                    Verified
                                </div>
                            ) : (
                                <div className="flex items-center text-amber-600 dark:text-amber-400 text-sm font-medium">
                                    <ExclamationTriangleIcon className="w-4 h-4 mr-1.5" />
                                    Unverified
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {!isVerified && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResend}
                        loading={isResending}
                        disabled={cooldown > 0}
                        className="border-amber-200 dark:border-amber-900 hover:bg-amber-50 dark:hover:bg-amber-900/10 text-amber-700 dark:text-amber-400 min-w-[150px]"
                    >
                        {cooldown > 0 ? `Resend (${cooldown}s)` : 'Resend Verification'}
                    </Button>
                )}
            </div>

            {!isVerified && (
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-900/30">
                    <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                        Your email is unverified. Some features may be restricted until you click the confirmation link sent to your email address.
                    </p>
                </div>
            )}
        </div>
    );
}
