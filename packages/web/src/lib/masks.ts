/**
 * Formats a string as CPF: 000.000.000-00
 */
export const formatCPF = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    return digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

/**
 * Formats a string as Telephone: +XX (XX) XXXXX-XXXX or (XX) XXXXX-XXXX
 * Supports international and national formats
 */
export const formatPhone = (value: string): string => {
    // Check if it starts with + for international
    const isInternational = value.startsWith('+');
    let digits = value.replace(/\D/g, '');

    if (isInternational) {
        // Limit to 13 digits (max international usually)
        digits = digits.slice(0, 13);

        // +XX (XX) XXXXX-XXXX
        if (digits.length <= 2) return `+${digits}`;
        if (digits.length <= 4) return `+${digits.slice(0, 2)} (${digits.slice(2)})`;
        if (digits.length <= 9) return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4)}`;
        return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
    } else {
        // National format: (XX) XXXXX-XXXX
        digits = digits.slice(0, 11);

        if (digits.length <= 2) return digits.length > 0 ? `(${digits}` : '';
        if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
};

/**
 * Formats a string as CEP: 00000-000
 */
export const formatCEP = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    return digits.replace(/(\d{5})(\d)/, '$1-$2');
};
