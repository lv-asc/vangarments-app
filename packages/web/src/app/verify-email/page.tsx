'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function VerifyEmailPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setErrorMessage('Validation token is missing.');
            return;
        }

        const verifyEmail = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
                const response = await fetch(`${apiUrl}/auth/verify-email`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ token }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error?.message || 'Verification failed');
                }

                setStatus('success');
            } catch (error: any) {
                setStatus('error');
                setErrorMessage(error.message);
            }
        };

        verifyEmail();
    }, [token]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
                    {status === 'verifying' && (
                        <div className="space-y-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00132d] mx-auto"></div>
                            <h2 className="text-xl font-medium text-gray-900">Verifying your email...</h2>
                            <p className="text-gray-500">Please wait while we verify your email address.</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="space-y-6">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                                <CheckCircleIcon className="h-8 w-8 text-green-600" aria-hidden="true" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Email Verified!</h2>
                            <p className="text-gray-500">
                                Your email has been successfully verified. You can now log in to your account.
                            </p>
                            <div className="mt-6">
                                <Link href="/login">
                                    <Button className="w-full">
                                        Go to Login
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="space-y-6">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                                <XCircleIcon className="h-8 w-8 text-red-600" aria-hidden="true" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Verification Failed</h2>
                            <p className="text-red-500">{errorMessage}</p>
                            <p className="text-gray-500 text-sm">
                                The verification link may be invalid or has expired.
                            </p>
                            <div className="mt-6">
                                <Link href="/login">
                                    <Button variant="outline" className="w-full">
                                        Back to Login
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
