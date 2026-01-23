import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Button } from '@/components/ui/Button';
import { XMarkIcon, CalendarIcon, LockClosedIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

interface ConnectAppleCalendarModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConnected: () => void;
}

export function ConnectAppleCalendarModal({
    isOpen,
    onClose,
    onConnected
}: ConnectAppleCalendarModalProps) {
    const [email, setEmail] = useState('');
    const [appPassword, setAppPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !appPassword) {
            toast.error('Email and App-Specific Password are required');
            return;
        }

        try {
            setIsLoading(true);
            const response = await apiClient.connectAppleCalendar(email, appPassword);

            if (response.success) {
                toast.success('Apple Calendar connected successfully!');
                onConnected();
                onClose();
            } else {
                toast.error('Failed to connect Apple Calendar');
            }
        } catch (error: any) {
            toast.error(error.message || 'An error occurred during connection');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:p-6 border border-gray-200 dark:border-gray-800">
                                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                                    <button
                                        type="button"
                                        className="rounded-md bg-white dark:bg-gray-900 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                                        onClick={onClose}
                                    >
                                        <span className="sr-only">Close</span>
                                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                    </button>
                                </div>

                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-black sm:mx-0 sm:h-10 sm:w-10">
                                        <CalendarIcon className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                                        <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                                            Connect Apple Calendar
                                        </Dialog.Title>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                To sync events, you'll need to use an <strong>App-Specific Password</strong> from your Apple ID account.
                                            </p>
                                        </div>

                                        <form onSubmit={handleConnect} className="mt-6 space-y-4">
                                            <div>
                                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Apple ID Email
                                                </label>
                                                <div className="mt-1 relative rounded-md shadow-sm">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <EnvelopeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                                    </div>
                                                    <input
                                                        type="email"
                                                        name="email"
                                                        id="email"
                                                        required
                                                        className="block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-primary focus:border-primary"
                                                        placeholder="email@icloud.com"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label htmlFor="appPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    App-Specific Password
                                                </label>
                                                <div className="mt-1 relative rounded-md shadow-sm">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <LockClosedIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                                    </div>
                                                    <input
                                                        type="password"
                                                        name="appPassword"
                                                        id="appPassword"
                                                        required
                                                        className="block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-primary focus:border-primary"
                                                        placeholder="xxxx-xxxx-xxxx-xxxx"
                                                        value={appPassword}
                                                        onChange={(e) => setAppPassword(e.target.value)}
                                                    />
                                                </div>
                                                <p className="mt-2 text-xs text-gray-500">
                                                    Don't use your main Apple ID password. Create one at <a href="https://appleid.apple.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">appleid.apple.com</a>.
                                                </p>
                                            </div>

                                            <div className="mt-8 sm:flex sm:flex-row-reverse sm:gap-3">
                                                <Button
                                                    type="submit"
                                                    disabled={isLoading}
                                                    className="w-full sm:w-auto bg-black text-white hover:bg-gray-900"
                                                >
                                                    {isLoading ? 'Connecting...' : 'Connect Calendar'}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={onClose}
                                                    className="mt-3 sm:mt-0 w-full sm:w-auto"
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
