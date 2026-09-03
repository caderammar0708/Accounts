
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDownIcon, XMarkIcon } from '../icons/Icons';
import { debounce } from 'lodash';

interface Option {
    value: string | number;
    label: string;
}

interface SearchableSelectProps {
    value: string | number | undefined;
    onChange: (value: string | number | undefined) => void;
    label: string;
    url?: string;
    options?: Option[];
    initialSelectedOption?: Option;
    initialLabel?: string;
    placeholder?: string;
    error?: string;
    disabled?: boolean;
    onCreate?: (inputValue: string) => void;
    params?: Record<string, any>;
    containerClassName?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
    value,
    onChange,
    label,
    url,
    options: providedOptions,
    initialSelectedOption,
    initialLabel,
    placeholder = 'Select an option...',
    error,
    disabled = false,
    onCreate,
    params,
    containerClassName = '',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [options, setOptions] = useState<Option[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedOptionLabel, setSelectedOptionLabel] = useState<string | undefined>(initialLabel || initialSelectedOption?.label);
    const selectRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setSelectedOptionLabel(initialLabel || initialSelectedOption?.label);
    }, [initialSelectedOption, initialLabel]);

    const fetchOptions = useCallback(
        debounce(async (term: string) => {
            if (!url) return;

            if (term.length < 1 && options.length > 0 && !isOpen) {
                return;
            }
            setIsLoading(true);
            try {
                const queryParams = new URLSearchParams({ q: term, ...params });
                const response = await fetch(`${url}?${queryParams.toString()}`);
                const data = await response.json();
                setOptions(data);
            } catch (error) {
                console.error("Failed to fetch options:", error);
                setOptions([]);
            }
            setIsLoading(false);
        }, 300),
        [url, isOpen, params]
    );

    useEffect(() => {
        if (isOpen) {
            if (url) {
                fetchOptions(searchTerm);
            } else if (providedOptions) {
                const filtered = providedOptions.filter(opt =>
                    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
                );
                setOptions(filtered);
            }
        }
    }, [searchTerm, isOpen, fetchOptions, url, providedOptions]);

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
        onChange(option.value);
        setSelectedOptionLabel(option.label);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(undefined);
        setSelectedOptionLabel(undefined);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleCreate = () => {
        if (onCreate && searchTerm) {
            onCreate(searchTerm);
            setIsOpen(false);
            setSearchTerm('');
        }
    };

    const toggleOpen = () => {
        if (disabled) return;
        const willOpen = !isOpen;
        setIsOpen(willOpen);
        if (willOpen) {
            if (url) {
                fetchOptions(''); // Fetch initial list when opened
            } else if (providedOptions) {
                setOptions(providedOptions);
            }
        }
    }

    return (
        <div className={containerClassName}>
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            <div ref={selectRef} className="relative mt-1">
                <button
                    type="button"
                    disabled={disabled}
                    onClick={toggleOpen}
                    className={`relative w-full cursor-default rounded-md border ${error ? 'border-red-500' : 'border-gray-300'} bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                >
                    <span className={`block truncate ${selectedOptionLabel ? 'text-gray-900' : 'text-gray-500'}`}>
                        {selectedOptionLabel || value || placeholder}
                    </span>
                    {value && !disabled && (
                        <span
                            className="absolute inset-y-0 right-5 flex items-center pr-2 cursor-pointer"
                            onClick={handleClear}
                        >
                            <XMarkIcon
                                className="h-4 w-4 text-gray-400 hover:text-gray-600"
                            />
                        </span>
                    )}
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronDownIcon className={`h-5 w-5 text-gray-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                    </span>
                </button>

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
                                options.map(option => (
                                    <li
                                        key={option.value}
                                        onClick={() => handleSelect(option)}
                                        className="relative cursor-pointer select-none py-2 pl-3 pr-9 text-gray-900 hover:bg-green-100"
                                    >
                                        <span className="block truncate">{option.label}</span>
                                    </li>
                                ))
                            ) : (
                                <>
                                    {onCreate && searchTerm ? (
                                        <li
                                            onClick={handleCreate}
                                            className="relative cursor-pointer select-none py-2 px-3 text-green-700 hover:bg-green-100"
                                        >
                                            Create new "{searchTerm}"
                                        </li>
                                    ) : (
                                        <li className="relative cursor-default select-none py-2 px-3 text-gray-500">
                                            No options found.
                                        </li>
                                    )}
                                </>
                            )}
                        </ul>
                    </div>
                )}
            </div>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
};

export default SearchableSelect;
