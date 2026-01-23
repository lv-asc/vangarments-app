import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Button } from '@/components/ui/Button';
import { XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { UserProfile } from '@vangarments/shared';

interface SyncProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSync: (selectedFields: any) => Promise<void>;
    currentProfile: UserProfile;
    provider: 'google' | 'facebook' | 'apple';
    providerData: any;
    isLoading?: boolean;
}

export function SyncProfileModal({
    isOpen,
    onClose,
    onSync,
    currentProfile,
    provider,
    providerData,
    isLoading = false
}: SyncProfileModalProps) {
    const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());

    // Reset selection when opening
    useEffect(() => {
        if (isOpen) {
            console.log('Provider Data for Sync:', { provider, providerData });
            setSelectedFields(new Set());
        }
    }, [isOpen, provider, providerData]);

    const toggleField = (field: string) => {
        const newSelected = new Set(selectedFields);
        if (newSelected.has(field)) {
            newSelected.delete(field);
        } else {
            newSelected.add(field);
        }
        setSelectedFields(newSelected);
    };

    const handleSync = async () => {
        const updates: any = {};

        if (selectedFields.has('name')) updates.name = providerData.name;
        if (selectedFields.has('avatar')) {
            if (provider === 'apple') {
                // Apple doesn't provide avatarUrl
            } else {
                updates.profile = { ...updates.profile, avatarUrl: providerData.picture };
            }
        }

        if (selectedFields.has('birthday')) {
            let birthDate = providerData.birthday;
            // Handle Google format: { day, month, year }
            if (birthDate && typeof birthDate === 'object' && 'day' in birthDate) {
                const year = birthDate.year;
                const month = String(birthDate.month).padStart(2, '0');
                const day = String(birthDate.day).padStart(2, '0');
                birthDate = `${year}-${month}-${day}`;
            }
            updates.profile = { ...updates.profile, birthDate };
        }

        if (selectedFields.has('gender')) {
            updates.profile = { ...updates.profile, gender: providerData.gender, genderOther: undefined };
        }

        if (selectedFields.has('phone')) {
            updates.profile = { ...updates.profile, telephone: providerData.phone };
        }

        await onSync(updates);
    };

    // Helper to format values for display
    const formatValue = (key: string, value: any) => {
        if (!value) return null;

        if (key === 'birthday') {
            if (typeof value === 'object' && value.day) { // Google format {day, month, year}
                return `${String(value.day).padStart(2, '0')}/${String(value.month).padStart(2, '0')}/${value.year}`;
            }
            try {
                const date = new Date(value);
                if (!isNaN(date.getTime())) {
                    return date.toLocaleDateString('pt-BR'); // or use dynamic locale
                }
            } catch (e) { }
        }

        if (key === 'gender') {
            const genders: any = {
                'male': 'Male',
                'female': 'Female',
                'other': 'Other',
                'not_specified': 'Not Specified',
                'prefer-not-to-say': 'Prefer not to say'
            };
            return genders[value] || (typeof value === 'string' ? value.charAt(0).toUpperCase() + value.slice(1) : String(value));
        }

        return String(value);
    };

    // Normalize provider values for display
    const getProviderValue = (key: string) => {
        if (!providerData) return null;
        switch (key) {
            case 'name': return providerData.name;
            case 'avatar': return provider === 'apple' ? null : providerData.picture;
            case 'birthday': return providerData.birthday;
            case 'gender': return providerData.gender;
            case 'phone': return providerData.phone;
            default: return null;
        }
    };

    // Get current profile values
    const getCurrentValue = (key: string) => {
        if (!currentProfile?.personalInfo) return null;
        switch (key) {
            case 'name': return currentProfile.personalInfo.name;
            case 'avatar': return currentProfile.personalInfo.avatarUrl;
            case 'birthday': return currentProfile.personalInfo.birthDate;
            case 'gender': return currentProfile.personalInfo.gender;
            case 'phone': return currentProfile.personalInfo.telephone;
            default: return null;
        }
    };

    const fields = [
        { key: 'name', label: 'Full Name', icon: null },
        { key: 'avatar', label: 'Profile Picture', icon: null }, // Special handling for image
        { key: 'birthday', label: 'Birthday', icon: null },
        { key: 'gender', label: 'Gender', icon: null },
        { key: 'phone', label: 'Phone Number', icon: null },
    ];

    // Filter fields that are actually available in providerData
    const availableFields = fields.filter(f => {
        const val = getProviderValue(f.key);
        return val !== null && val !== undefined && val !== '';
    });

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
                            <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-xl sm:p-6 border border-gray-200 dark:border-gray-800">
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
                                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 sm:mx-0 sm:h-10 sm:w-10">
                                        <ArrowPathIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                                    </div>
                                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                                        <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                                            Sync Profile Information
                                        </Dialog.Title>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Select the information you want to update from your {provider === 'google' ? 'Google' : provider === 'apple' ? 'Apple' : 'Facebook'} account.
                                                Existing information will be overwritten.
                                            </p>
                                        </div>

                                        <div className="mt-6 space-y-4">
                                            {availableFields.length === 0 ? (
                                                <p className="text-center text-gray-500 py-4">No information available to sync.</p>
                                            ) : (
                                                <div className="grid grid-cols-1 gap-4">
                                                    <div className="grid grid-cols-12 gap-4 pb-2 border-b border-gray-100 dark:border-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-wider px-3">
                                                        <div className="col-span-5">Vangarments</div>
                                                        <div className="col-span-2 text-center"></div>
                                                        <div className="col-span-5 text-right">{provider === 'google' ? 'Google' : provider === 'apple' ? 'Apple' : 'Facebook'}</div>
                                                    </div>

                                                    {availableFields.map((field) => {
                                                        const pVal = getProviderValue(field.key);
                                                        const cVal = getCurrentValue(field.key);
                                                        const isSelected = selectedFields.has(field.key);

                                                        return (
                                                            <div
                                                                key={field.key}
                                                                className={`
                                                                    flex flex-col space-y-3 p-4 rounded-xl border cursor-pointer transition-all duration-200
                                                                    ${isSelected
                                                                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                                                        : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-900'
                                                                    }
                                                                `}
                                                                onClick={() => toggleField(field.key)}
                                                            >
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{field.label}</span>
                                                                    <div className={`
                                                                        h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors
                                                                        ${isSelected ? 'bg-primary border-primary' : 'border-gray-300 dark:border-gray-700'}
                                                                    `}>
                                                                        {isSelected && (
                                                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                            </svg>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="grid grid-cols-12 gap-4 items-center">
                                                                    <div className="col-span-5 text-sm text-gray-900 dark:text-white truncate">
                                                                        {field.key === 'avatar' && typeof cVal === 'string' ? (
                                                                            <img src={cVal} alt="Current" className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 object-cover" />
                                                                        ) : (
                                                                            <span className="font-medium truncate">{formatValue(field.key, cVal) || <span className="text-gray-400 italic font-normal">Not set</span>}</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="col-span-2 flex justify-center text-gray-300 dark:text-gray-700">
                                                                        <ArrowPathIcon className={`w-5 h-5 ${isSelected ? 'text-primary animate-spin-slow' : ''}`} />
                                                                    </div>
                                                                    <div className="col-span-5 text-sm text-gray-900 dark:text-white text-right truncate">
                                                                        <div className="flex justify-end">
                                                                            {field.key === 'avatar' && typeof pVal === 'string' ? (
                                                                                <img src={pVal} alt="New" className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 object-cover" />
                                                                            ) : (
                                                                                <span className="font-semibold truncate text-primary">{formatValue(field.key, pVal)}</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 sm:mt-6 sm:flex sm:flex-row-reverse sm:gap-3">
                                    <Button
                                        onClick={handleSync}
                                        disabled={isLoading || selectedFields.size === 0}
                                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        {isLoading ? 'Syncing...' : `Sync Selected (${selectedFields.size})`}
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
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
