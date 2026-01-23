'use client';

import React, { useState, useEffect, useRef } from 'react';
import { COUNTRIES } from '@/lib/constants';
import { MagnifyingGlassIcon, XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline'; // Using outline for consistent UI

interface CountrySelectProps {
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export default function CountrySelect({ value, onChange, placeholder = "Select a country..." }: CountrySelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Initial value handling: if value is provided, pre-fill search (optional UX choice, sticking to standard behavior)
    // But since this is a Type-Dropdown, the input IS the search.

    // Get selected country object for display
    const selectedCountry = COUNTRIES.find(c => c.name === value);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Update search term when value changes externally or upon selection clearing
    useEffect(() => {
        if (!value) {
            setSearchTerm('');
        }
    }, [value]);


    const filteredCountries = COUNTRIES.filter(country =>
        country.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (countryName: string) => {
        onChange(countryName);
        setSearchTerm(''); // Clear search on select or keep it? User workflow implies just selecting.
        setIsOpen(false);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
        setSearchTerm('');
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Input Trigger */}
            <div
                className="relative cursor-text"
                onClick={() => setIsOpen(true)}
            >
                {/* 
                   If a country is selected, we show it with flag.
                   If dropdown is open, we show input for searching.
                   This dual-mode is tricky. "Type-Dropdown Combo" usually implies the input is always editable.
                   Let's stick to the workflow: "Use an input field for searching"
                */}

                <div className="relative w-full border border-gray-300 rounded-lg px-3 py-2 bg-white flex items-center shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
                    <MagnifyingGlassIcon className={`h-5 w-5 text-gray-400 mr-2 ${isOpen ? 'text-blue-500' : ''}`} />

                    {/* Render input or selected value */}
                    {!isOpen && value ? (
                        <div className="flex-1 flex items-center text-gray-900 font-medium">
                            <span className="mr-2 text-lg leading-none">{selectedCountry?.flag}</span>
                            <span>{value}</span>
                        </div>
                    ) : (
                        <input
                            type="text"
                            placeholder={value ? "Change country..." : placeholder}
                            className="flex-1 outline-none text-sm text-gray-900 placeholder:text-gray-400 bg-transparent h-full w-full"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                if (!isOpen) setIsOpen(true);
                            }}
                            onFocus={() => setIsOpen(true)}
                            autoFocus={isOpen && !!value} // Auto focus if reopening to change
                        />
                    )}

                    {/* Actions */}
                    <div className="flex items-center ml-2">
                        {value ? (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-gray-100"
                            >
                                <XMarkIcon className="h-4 w-4" />
                            </button>
                        ) : (
                            <div className="pointer-events-none">
                                <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100 origin-top">
                    {filteredCountries.length > 0 ? (
                        <div className="py-1">
                            {filteredCountries.map(country => (
                                <button
                                    key={country.code}
                                    type="button"
                                    onClick={() => handleSelect(country.name)}
                                    className={`w-full text-left px-4 py-3 flex items-center hover:bg-gray-50 transition-colors ${value === country.name ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                                >
                                    <span className="text-2xl mr-3">{country.flag}</span>
                                    <span className="text-sm">{country.name}</span>
                                    {value === country.name && (
                                        <span className="ml-auto text-blue-600 text-xs font-bold uppercase tracking-wider">Active</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="px-4 py-8 text-center text-gray-500 text-sm">
                            No countries found matching "{searchTerm}"
                        </div>
                    )}

                    {/* Sticky Footer (Optional "Done" button from workflow, though selection usually closes) */}
                    {/* <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 p-2 flex justify-end">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 px-3 py-1 bg-white border border-blue-200 rounded-md hover:shadow-sm transition-all"
                        >
                            Done
                        </button>
                    </div> */}
                </div>
            )}
        </div>
    );
}
