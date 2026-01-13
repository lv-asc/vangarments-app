'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, CheckIcon, UserIcon, BuildingStorefrontIcon, TruckIcon, HeartIcon, DocumentTextIcon, SparklesIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { getImageUrl } from '@/utils/imageUrl';

interface SwitchableAccount {
    id: string;
    type: 'user' | 'brand' | 'store' | 'supplier' | 'non_profit' | 'page';
    name: string;
    username?: string;
    slug?: string;
    avatar?: string;
    email?: string;
    telephone?: string;
    responsibleUserId?: string;
}

interface ActiveAccount {
    type: 'user' | 'brand' | 'store' | 'supplier' | 'non_profit' | 'page';
    id: string;
    name: string;
    username?: string;
    slug?: string;
    avatar?: string;
}

interface SwitchAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentAccount: ActiveAccount | null;
    onSwitchAccount: (account: ActiveAccount) => void;
}

const ENTITY_TYPE_CONFIG: Record<string, { label: string; icon: React.ComponentType<any>; labelPlural: string }> = {
    user: { label: 'User', labelPlural: 'Users', icon: UserIcon },
    brand: { label: 'Brand', labelPlural: 'Brands', icon: SparklesIcon },
    store: { label: 'Store', labelPlural: 'Stores', icon: BuildingStorefrontIcon },
    supplier: { label: 'Supplier', labelPlural: 'Suppliers', icon: TruckIcon },
    non_profit: { label: 'Non-Profit', labelPlural: 'Non-Profits', icon: HeartIcon },
    page: { label: 'Page', labelPlural: 'Pages', icon: DocumentTextIcon },
};

export default function SwitchAccountModal({ isOpen, onClose, currentAccount, onSwitchAccount }: SwitchAccountModalProps) {
    const [loading, setLoading] = useState(true);
    const [accounts, setAccounts] = useState<{
        users: SwitchableAccount[];
        brands: SwitchableAccount[];
        stores: SwitchableAccount[];
        suppliers: SwitchableAccount[];
        nonProfits: SwitchableAccount[];
        pages: SwitchableAccount[];
    } | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadAccounts();
        }
    }, [isOpen]);

    const loadAccounts = async () => {
        setLoading(true);
        try {
            const response = await apiClient.getSwitchableAccounts();
            setAccounts(response.accounts);
        } catch (error: any) {
            console.error('Failed to load switchable accounts:', error);
            setError(error.details || error.message || 'Failed to load accounts');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAccount = (account: SwitchableAccount) => {
        const activeAccount: ActiveAccount = {
            type: account.type,
            id: account.id,
            name: account.name,
            username: account.username,
            slug: account.slug,
            avatar: account.avatar,
        };
        onSwitchAccount(activeAccount);
        onClose();
    };

    const isCurrentAccount = (account: SwitchableAccount) => {
        if (!currentAccount) return account.type === 'user';
        return currentAccount.type === account.type && currentAccount.id === account.id;
    };

    const renderAccountItem = (account: SwitchableAccount) => {
        const isCurrent = isCurrentAccount(account);
        const config = ENTITY_TYPE_CONFIG[account.type];
        const Icon = config?.icon || UserIcon;

        return (
            <button
                key={`${account.type}-${account.id}`}
                onClick={() => handleSelectAccount(account)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isCurrent
                    ? 'bg-[#00132d]/10 border border-[#00132d]/30'
                    : 'hover:bg-gray-50'
                    }`}
            >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                    {account.avatar ? (
                        <img
                            src={getImageUrl(account.avatar)}
                            alt={account.name}
                            className="w-12 h-12 rounded-full object-cover border border-gray-200"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                            <Icon className="w-6 h-6 text-gray-500" />
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 text-left min-w-0">
                    <p className="font-medium text-gray-900 truncate">{account.name}</p>
                    <p className="text-sm text-gray-500 truncate">
                        @{account.username || account.slug || account.id.slice(0, 8)}
                    </p>
                </div>

                {/* Check mark for current */}
                {isCurrent && (
                    <div className="flex-shrink-0">
                        <CheckIcon className="w-5 h-5 text-[#00132d]" />
                    </div>
                )}
            </button>
        );
    };

    const renderAccountGroup = (type: string, accountList: SwitchableAccount[]) => {
        if (!accountList || accountList.length === 0) return null;

        const config = ENTITY_TYPE_CONFIG[type];
        const Icon = config?.icon || UserIcon;

        return (
            <div key={type} className="mb-4">
                <div className="flex items-center gap-2 px-4 mb-2">
                    <Icon className="w-4 h-4 text-gray-400" />
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {config?.labelPlural || type}
                    </h3>
                </div>
                <div className="space-y-1">
                    {accountList.map(renderAccountItem)}
                </div>
            </div>
        );
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
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
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                                {/* Header */}
                                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                    <Dialog.Title as="h2" className="text-lg font-semibold text-gray-900">
                                        Switch Account
                                    </Dialog.Title>
                                    <button
                                        onClick={onClose}
                                        className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                                    >
                                        <XMarkIcon className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="max-h-[60vh] overflow-y-auto py-4">
                                    {loading ? (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00132d]"></div>
                                        </div>
                                    ) : accounts ? (
                                        <div>
                                            {renderAccountGroup('user', accounts.users)}
                                            {renderAccountGroup('brand', accounts.brands)}
                                            {renderAccountGroup('store', accounts.stores)}
                                            {renderAccountGroup('supplier', accounts.suppliers)}
                                            {renderAccountGroup('non_profit', accounts.nonProfits)}
                                            {renderAccountGroup('page', accounts.pages)}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 px-6">
                                            <p className="text-gray-500 mb-2">Failed to load accounts</p>
                                            {error && <p className="text-xs text-red-500/70 italic">{error}</p>}
                                            <button
                                                onClick={loadAccounts}
                                                className="mt-4 text-sm text-[#00132d] font-semibold hover:underline"
                                            >
                                                Try again
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                                    <Link
                                        href="/login"
                                        onClick={onClose}
                                        className="block w-full py-2 text-center text-sm text-[#00132d] hover:text-[#00132d]/70 font-medium transition-colors"
                                    >
                                        Add Existing Account
                                    </Link>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
