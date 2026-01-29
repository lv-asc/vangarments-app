import { Fragment, useState, useEffect } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { apiClient } from '@/lib/api';
import Image from 'next/image';
import { EntityRef } from '@vangarments/shared/types/vufs';

interface UserEntitySelectProps {
    value: EntityRef | undefined;
    onChange: (value: EntityRef | undefined) => void;
    placeholder?: string;
    types?: string[]; // 'user', 'brand', 'store'
    label?: string;
    className?: string; // Add className prop support
    excludeIds?: string[];
}

export function UserEntitySelect({ value, onChange, placeholder = "Search...", types, label, className, excludeIds = [] }: UserEntitySelectProps) {
    const [query, setQuery] = useState('');
    const [options, setOptions] = useState<EntityRef[]>([]);
    const [loading, setLoading] = useState(false);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length < 2) {
                setOptions([]);
                return;
            }

            setLoading(true);
            try {
                const typeQuery = types ? `&types=${types.join(',')}` : '';
                const response = await apiClient.get<{ results: any[] }>(`/search/entities?q=${encodeURIComponent(query)}${typeQuery}`);

                // Map backend response to EntityRef
                const mapped: EntityRef[] = response.results.map(item => ({
                    id: item.id,
                    type: item.type,
                    name: item.name,
                    image: item.image
                }));

                setOptions(mapped.filter(item => !(excludeIds || []).includes(item.id)));
            } catch (error) {
                console.error('Search failed:', error);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query, types, excludeIds]);

    // Handle display value
    const displayValue = (item: EntityRef | undefined) => {
        if (!item) return '';
        return item.name;
    };

    return (
        <div className={className}>
            {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
            <Combobox value={value} onChange={onChange} nullable>
                <div className="relative mt-1">
                    <div className="relative w-full cursor-default overflow-hidden rounded-md bg-white text-left border border-gray-300 shadow-sm focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500 sm:text-sm flex items-center">
                        {value && (
                            <div className="ml-3 flex-shrink-0">
                                {value.image ? (
                                    <div className="h-6 w-6 rounded-full overflow-hidden border border-gray-200">
                                        <img src={value.image} alt="" className="h-full w-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold bg-gray-200 text-gray-500">
                                        {value.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                        )}
                        <Combobox.Input
                            className={`w-full border-none py-2 ${value ? 'pl-2' : 'pl-3'} pr-10 text-sm leading-5 text-gray-900 focus:ring-0 focus:outline-none`}
                            displayValue={(item: any) => displayValue(item)}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder={placeholder}
                        />
                        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </Combobox.Button>
                    </div>
                    <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                        afterLeave={() => setQuery('')}
                    >
                        <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-50">
                            {loading ? (
                                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">Loading...</div>
                            ) : options.length === 0 && query !== '' ? (
                                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                    Nothing found.
                                </div>
                            ) : (
                                options.map((opt) => (
                                    <Combobox.Option
                                        key={`${opt.type}-${opt.id}`}
                                        className={({ active }) =>
                                            `relative cursor-default select-none py-2 pl-3 pr-9 ${active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                                            }`
                                        }
                                        value={opt}
                                    >
                                        {({ selected, active }) => (
                                            <div className="flex items-center">
                                                {opt.image ? (
                                                    <div className="relative h-6 w-6 mr-2 rounded-full overflow-hidden flex-shrink-0 border border-gray-200">
                                                        <img
                                                            src={opt.image}
                                                            alt=""
                                                            className="h-full w-full object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className={`h-6 w-6 mr-2 rounded-full flex items-center justify-center text-xs font-bold ${active ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                                        {opt.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                                    {opt.name}
                                                    <span className={`ml-2 text-xs ${active ? 'text-indigo-200' : 'text-gray-500'}`}>
                                                        {opt.type}
                                                    </span>
                                                </span>
                                                {selected ? (
                                                    <span className={`absolute inset-y-0 right-0 flex items-center pr-4 ${active ? 'text-white' : 'text-indigo-600'}`}>
                                                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                    </span>
                                                ) : null}
                                            </div>
                                        )}
                                    </Combobox.Option>
                                ))
                            )}
                        </Combobox.Options>
                    </Transition>
                </div>
            </Combobox>
        </div>
    );
}
