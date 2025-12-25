'use client';

import React, { useState, useEffect } from 'react';

interface FoundationDateInputProps {
    value?: string;
    precision?: 'year' | 'month' | 'day';
    onChange: (date: string, precision: 'year' | 'month' | 'day') => void;
    label?: string;
    className?: string;
}

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * FoundationDateInput - A flexible date input that allows users to enter:
 * - Year only (e.g., "1953")
 * - Month + Year (e.g., "March 1953")
 * - Full date (e.g., "March 15, 1953")
 * 
 * The precision is stored alongside the date to control display formatting.
 */
export default function FoundationDateInput({
    value = '',
    precision = 'year',
    onChange,
    label = 'Date of Foundation',
    className = ''
}: FoundationDateInputProps) {
    // Parse the incoming value
    const [year, setYear] = useState('');
    const [month, setMonth] = useState('');
    const [day, setDay] = useState('');
    const [currentPrecision, setCurrentPrecision] = useState<'year' | 'month' | 'day'>(precision);

    useEffect(() => {
        if (value) {
            // Parse ISO date or year-only format
            if (value.length === 4) {
                // Year only
                setYear(value);
                setMonth('');
                setDay('');
            } else if (value.length === 7) {
                // YYYY-MM
                const [y, m] = value.split('-');
                setYear(y);
                setMonth(m);
                setDay('');
            } else if (value.includes('-') && value.length >= 10) {
                // Full date YYYY-MM-DD
                const [y, m, d] = value.split('-');
                setYear(y);
                setMonth(m);
                setDay(d);
            }
        }
        setCurrentPrecision(precision || 'year');
    }, [value, precision]);

    const handleChange = (newYear: string, newMonth: string, newDay: string) => {
        setYear(newYear);
        setMonth(newMonth);
        setDay(newDay);

        // Determine precision and build date string
        let dateStr = '';
        let newPrecision: 'year' | 'month' | 'day' = 'year';

        if (newYear) {
            if (newDay && newMonth) {
                // Full date
                dateStr = `${newYear}-${newMonth.padStart(2, '0')}-${newDay.padStart(2, '0')}`;
                newPrecision = 'day';
            } else if (newMonth) {
                // Month + Year
                dateStr = `${newYear}-${newMonth.padStart(2, '0')}`;
                newPrecision = 'month';
            } else {
                // Year only
                dateStr = newYear;
                newPrecision = 'year';
            }
        }

        setCurrentPrecision(newPrecision);
        onChange(dateStr, newPrecision);
    };

    // Generate year options (from 1800 to current year)
    const currentYear = new Date().getFullYear();
    const years: string[] = [];
    for (let y = currentYear; y >= 1800; y--) {
        years.push(String(y));
    }

    // Generate day options based on month/year
    const getDaysInMonth = (m: string, y: string) => {
        if (!m || !y) return 31;
        return new Date(parseInt(y), parseInt(m), 0).getDate();
    };

    const daysInMonth = getDaysInMonth(month, year);
    const days: string[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
        days.push(String(d));
    }

    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
            )}
            <div className="flex gap-2 flex-wrap">
                {/* Day (optional) */}
                <select
                    value={day}
                    onChange={(e) => handleChange(year, month, e.target.value)}
                    className="block w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                    disabled={!month}
                >
                    <option value="">Day</option>
                    {days.map(d => (
                        <option key={d} value={d.padStart(2, '0')}>{d}</option>
                    ))}
                </select>

                {/* Month (optional) */}
                <select
                    value={month}
                    onChange={(e) => {
                        // If month is cleared, also clear day
                        if (!e.target.value) {
                            handleChange(year, '', '');
                        } else {
                            handleChange(year, e.target.value, day);
                        }
                    }}
                    className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                    disabled={!year}
                >
                    <option value="">Month</option>
                    {MONTHS.map((m, idx) => (
                        <option key={m} value={String(idx + 1).padStart(2, '0')}>{m}</option>
                    ))}
                </select>

                {/* Year (required for date) */}
                <select
                    value={year}
                    onChange={(e) => {
                        // If year is cleared, clear everything
                        if (!e.target.value) {
                            handleChange('', '', '');
                        } else {
                            handleChange(e.target.value, month, day);
                        }
                    }}
                    className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                >
                    <option value="">Year</option>
                    {years.map(y => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>
            </div>
            <p className="mt-1 text-xs text-gray-500">
                Select year first. Month and day are optional.
            </p>
        </div>
    );
}

/**
 * Helper function to format a foundation date for display
 */
export function formatFoundationDate(date: string, precision?: 'year' | 'month' | 'day'): string {
    if (!date) return '';

    // Determine precision from date format if not provided
    if (!precision) {
        if (date.length === 4) precision = 'year';
        else if (date.length === 7) precision = 'month';
        else precision = 'day';
    }

    if (precision === 'year') {
        return date.substring(0, 4);
    }

    const parts = date.split('-');
    const year = parts[0];
    const monthIdx = parseInt(parts[1] || '1', 10) - 1;
    const day = parseInt(parts[2] || '1', 10);

    if (precision === 'month') {
        return `${MONTHS[monthIdx]} ${year}`;
    }

    return `${MONTHS[monthIdx]} ${day}, ${year}`;
}
