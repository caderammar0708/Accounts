import React from 'react';

export const setDateField = (setData: any, field: string) => (date: Date | null) => {
    setData((prev: any) => ({
        ...prev,
        [field]: date ? date.toLocaleDateString('en-CA') : ''
    }));
};

export type TextCase = 'none' | 'title' | 'upper';

export const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    setData: (name: string, value: any) => void,
    options?: { caseType?: TextCase }
) => {
    const { name, value } = e.target;

    let finalValue = value;

    switch (options?.caseType) {
        case 'upper':
            finalValue = value.toUpperCase();
            break;

        case 'title':
            finalValue = toTitleCase(value);
            break;

        case 'none':
        default:
            finalValue = value;
    }
            
    setData(name, finalValue);
};

export const handleDateChange = (setData: any, field: string) => (date: Date | null) => {
    setData((prev: any) => ({
        ...prev,
        [field]: date ? dateFormat(date) : '',
    }));
};

export const dateFormat = (date: Date | null) => {
    if (!date) return '';
    
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const toTitleCase = (str: string): string => {
    if (!str) return '';

    return str
        .split('')
        .reduce((acc, char, idx) => {
            const prevChar = acc[idx - 1];
            if (idx === 0 || prevChar === ' ' || prevChar === '.') {
                return acc + char.toUpperCase();
            } else {
                return acc + char.toLowerCase();
            }
        }, '');
};
