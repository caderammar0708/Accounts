
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDownIcon, XMarkIcon } from '../icons/Icons';
import { debounce } from 'lodash';

interface Option {
    value: string | number;
    label: string;
}

interface MultiSelectProps {
    value: (string | number)[];
    onChange: (value: (string | number)[]) => void;
    label: string;
    searchUrl?: string;
    options?: Option[];
    placeholder?: string;
    error?: string;
    disabled?: boolean;
    containerClassName?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
    value = [], // Default to empty array
    onChange,
    label,
    searchUrl,
    options: providedOptions,
    placeholder = 'Select options...',
    error,
    disabled = false,
    containerClassName = '',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [options, setOptions] = useState<Option[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const selectRef = useRef<HTMLDivElement>(null);

    // Fetch options logic (same as SearchableSelect)
    const fetchOptions = useCallback(
        debounce(async (term: string) => {
            if (!searchUrl) return;

            if (term.length < 1 && !isOpen) {
                setOptions([]);
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                const response = await fetch(`${searchUrl}?search=${term}`);
                const data = await response.json();
                setOptions(data);
            } catch (error) {
                console.error("Failed to fetch options:", error);
                setOptions([]);
            }
            setIsLoading(false);
        }, 300),
        [searchUrl, isOpen]
    );

    useEffect(() => {
        if (isOpen) {
            if (searchUrl) {
                fetchOptions(searchTerm);
            } else if (providedOptions) {
                const filtered = providedOptions.filter(opt =>
                    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
                );
                setOptions(filtered);
            }
        }
    }, [searchTerm, isOpen, fetchOptions, searchUrl, providedOptions]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (option: Option) => {
        if (!value.includes(option.value)) {
            onChange([...value, option.value]);
        }
        setSearchTerm('');
    };

    const handleRemove = (e: React.MouseEvent, valToRemove: string | number) => {
        e.stopPropagation();
        if (disabled) return;
        onChange(value.filter(v => v !== valToRemove));
    };

    const toggleOpen = () => {
        if (disabled) return;
        const willOpen = !isOpen;
        setIsOpen(willOpen);
        if (willOpen) {
            if (searchUrl) {
                fetchOptions('');
            } else if (providedOptions) {
                setOptions(providedOptions);
            }
        }
    };

    // Helper to find label for a value
    const getLabel = (val: string | number) => {
        const opt = options.find(o => o.value === val) || providedOptions?.find(o => o.value === val);
        return opt ? opt.label : val;
    };

    return (
        <div className={containerClassName}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <div ref={selectRef} className="relative">
                <div
                    onClick={toggleOpen}
                    className={`min-h-[38px] w-full cursor-text rounded-md border ${error ? 'border-red-500' : 'border-gray-300'} bg-white py-1.5 pl-3 pr-10 text-left shadow-sm focus-within:ring-1 focus-within:ring-green-500 focus-within:border-green-500 sm:text-sm ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''} flex flex-wrap gap-1`}
                >
                    {value.length === 0 && (
                        <span className="text-gray-500 py-0.5">{placeholder}</span>
                    )}

                    {value.map((val) => (
                        <span key={val} className="inline-flex items-center rounded-sm bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                            {getLabel(val)}
                            <button
                                type="button"
                                onClick={(e) => handleRemove(e, val)}
                                className="ml-1 inline-flex flex-shrink-0 h-4 w-4 text-green-500 hover:text-green-700 focus:outline-none"
                            >
                                <span className="sr-only">Remove</span>
                                <XMarkIcon className="h-3 w-3" />
                            </button>
                        </span>
                    ))}

                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronDownIcon className={`h-5 w-5 text-gray-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                    </span>
                </div>

                {isOpen && !disabled && (
                    <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                        <div className="p-2">
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                autoFocus
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2"
                            />
                        </div>
                        <ul>
                            {isLoading ? (
                                <li className="relative cursor-default select-none py-2 px-3 text-gray-500">Loading...</li>
                            ) : options.length > 0 ? (
                                options.map(option => {
                                    const isSelected = value.includes(option.value);
                                    return (
                                        <li
                                            key={option.value}
                                            onClick={() => !isSelected && handleSelect(option)}
                                            className={`relative cursor-pointer select-none py-2 pl-3 pr-9 ${isSelected ? 'bg-green-50 text-green-900 cursor-not-allowed opacity-75' : 'text-gray-900 hover:bg-green-100'}`}
                                        >
                                            <span className="block truncate">{option.label}</span>
                                        </li>
                                    );
                                })
                            ) : (
                                <li className="relative cursor-default select-none py-2 px-3 text-gray-500">
                                    No options found.
                                </li>
                            )}
                        </ul>
                    </div>
                )}
            </div>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
};

export default MultiSelect;
