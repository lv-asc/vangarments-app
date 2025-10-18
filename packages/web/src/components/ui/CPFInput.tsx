'use client';

import { useState, useEffect } from 'react';

interface CPFInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

export function CPFInput({ 
  value, 
  onChange, 
  placeholder = "000.000.000-00",
  className = "",
  required = false,
  disabled = false 
}: CPFInputProps) {
  const [displayValue, setDisplayValue] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);

  // Format CPF as user types
  const formatCPF = (cpf: string): string => {
    // Remove all non-numeric characters
    const numbers = cpf.replace(/\D/g, '');
    
    // Apply CPF mask: 000.000.000-00
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 6) {
      return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    } else if (numbers.length <= 9) {
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    } else {
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
    }
  };

  // Validate CPF
  const validateCPF = (cpf: string): boolean => {
    const numbers = cpf.replace(/\D/g, '');
    
    if (numbers.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(numbers)) return false;
    
    let sum = 0;
    let remainder;
    
    // Validate first digit
    for (let i = 1; i <= 9; i++) {
      sum += parseInt(numbers.substring(i - 1, i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(numbers.substring(9, 10))) return false;
    
    // Validate second digit
    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(numbers.substring(i - 1, i)) * (12 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(numbers.substring(10, 11))) return false;
    
    return true;
  };

  // Update display value when prop value changes
  useEffect(() => {
    const formatted = formatCPF(value);
    setDisplayValue(formatted);
    
    // Validate if CPF is complete
    const numbers = value.replace(/\D/g, '');
    if (numbers.length === 11) {
      setIsValid(validateCPF(value));
    } else if (numbers.length === 0) {
      setIsValid(null);
    } else {
      setIsValid(null);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const numbers = inputValue.replace(/\D/g, '');
    
    // Limit to 11 digits
    if (numbers.length <= 11) {
      const formatted = formatCPF(inputValue);
      setDisplayValue(formatted);
      onChange(numbers);
    }
  };

  const getInputClassName = () => {
    let baseClass = `w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${className}`;
    
    if (disabled) {
      baseClass += ' bg-gray-100 cursor-not-allowed';
    } else if (isValid === true) {
      baseClass += ' border-green-300 focus:ring-green-500 focus:border-green-500';
    } else if (isValid === false) {
      baseClass += ' border-red-300 focus:ring-red-500 focus:border-red-500';
    } else {
      baseClass += ' border-gray-300 focus:ring-pink-500 focus:border-pink-500';
    }
    
    return baseClass;
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={getInputClassName()}
        required={required}
        disabled={disabled}
        maxLength={14} // 000.000.000-00
      />
      
      {/* Validation indicator */}
      {isValid !== null && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {isValid ? (
            <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
      )}
      
      {/* Validation message */}
      {isValid === false && (
        <p className="text-xs text-red-600 mt-1">
          CPF inválido
        </p>
      )}
      
      {/* Helper text */}
      {isValid === null && displayValue.length > 0 && displayValue.replace(/\D/g, '').length < 11 && (
        <p className="text-xs text-gray-500 mt-1">
          Digite seu CPF completo
        </p>
      )}
    </div>
  );
}