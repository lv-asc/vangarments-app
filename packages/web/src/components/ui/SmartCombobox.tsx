import { Fragment, useState } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';

// Generic Props Interface
interface SelectorProps {
    value: string;                  // The ID or Code stored in your form
    onChange: (val: string) => void; // Update form value
    options: Array<{ id: string; name: string; label?: string }>; // Data source
    placeholder?: string;
}

export function SmartCombobox({ value, onChange, options, placeholder = "Select or Type..." }: SelectorProps) {
    const [query, setQuery] = useState('');

    // FILTERING LOGIC: Based on 'query', not 'value'
    const filteredOptions =
        query === ''
            ? options
            : options.filter((opt) => {
                const lowerQuery = query.toLowerCase();
                return (
                    opt.name.toLowerCase().includes(lowerQuery) ||
                    (opt.label && opt.label.toLowerCase().includes(lowerQuery))
                );
            });

    return (
        <Combobox value={value} onChange={onChange as any} as="div">
            <div className="relative mt-1">
                <div className="relative w-full cursor-default overflow-hidden rounded-md bg-white text-left border border-gray-300 shadow-sm focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500 sm:text-sm">
                    <Combobox.Input
                        className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0 focus:outline-none"
                        // DISPLAY LOGIC: Show legible label for the selected ID
                        displayValue={(id: string) => {
                            const selected = options.find(opt => opt.id === id);
                            return selected ? `${selected.name}${selected.label ? ` (${selected.label})` : ''}` : '';
                        }}
                        // SEARCH LOGIC: Update query on type
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder={placeholder}
                    />
                    <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </Combobox.Button>
                </div>

                {/* RESET LOGIC: Clear query on close so next open shows ALL options */}
                <Transition
                    as={Fragment as any}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                    afterLeave={() => setQuery('')}
                >
                    <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-[100]">
                        {filteredOptions.length === 0 && query !== '' ? (
                            <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                Nothing found.
                            </div>
                        ) : (
                            filteredOptions.map((opt) => (
                                <Combobox.Option
                                    key={opt.id}
                                    className={({ active }) =>
                                        `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                                        }`
                                    }
                                    value={opt.id} // Store the ID
                                >
                                    {({ selected, active }) => (
                                        <>
                                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                                {opt.name} <span className={`text-xs ${active ? 'text-indigo-200' : 'text-gray-500'}`}>{opt.label}</span>
                                            </span>
                                            {selected ? (
                                                <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-indigo-600'}`}>
                                                    <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                </span>
                                            ) : null}
                                        </>
                                    )}
                                </Combobox.Option>
                            ))
                        )}
                    </Combobox.Options>
                </Transition>
            </div>
        </Combobox>
    );
}
