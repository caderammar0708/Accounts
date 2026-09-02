import React, { useState, useRef, useEffect, useMemo } from 'react';

export default function ItemMultiSelectFilter({
    items = [],
    selectedIds = [],
    onChange,
    label = "Items",
    placeholder = "All Items",
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [tempSelected, setTempSelected] = useState(selectedIds || []);
    const dropdownRef = useRef(null);
    const searchInputRef = useRef(null);

    // Sync tempSelected with selectedIds when selectedIds change or when opening
    useEffect(() => {
        setTempSelected(selectedIds || []);
    }, [selectedIds, isOpen]);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 50);
        }
    }, [isOpen]);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    // Filter items based on search query
    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) return items;
        const q = searchQuery.toLowerCase().trim();
        return items.filter(item => 
            (item.name && item.name.toLowerCase().includes(q)) ||
            (item.sku && item.sku.toLowerCase().includes(q))
        );
    }, [items, searchQuery]);

    // Toggle single item selection
    const toggleItem = (id) => {
        setTempSelected(prev => {
            const exists = prev.includes(id);
            if (exists) {
                return prev.filter(item => item !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    // Select all filtered items
    const handleSelectAll = () => {
        const allFilteredIds = filteredItems.map(i => i.id);
        setTempSelected(prev => {
            const set = new Set([...prev, ...allFilteredIds]);
            return Array.from(set);
        });
    };

    // Clear all selections
    const handleClearAll = () => {
        setTempSelected([]);
    };

    // Apply the selection to parent
    const handleApply = () => {
        onChange(tempSelected);
        setIsOpen(false);
    };

    // Quick clear from trigger button
    const handleQuickClear = (e) => {
        e.stopPropagation();
        setTempSelected([]);
        onChange([]);
    };

    // Determine trigger button label
    const selectedCount = (selectedIds || []).length;
    const triggerLabel = useMemo(() => {
        if (selectedCount === 0) {
            return placeholder;
        }
        if (selectedCount === 1) {
            const item = items.find(i => i.id === selectedIds[0]);
            return item ? item.name : '1 Item Selected';
        }
        return `${selectedCount} Items Selected`;
    }, [selectedCount, selectedIds, items, placeholder]);

    return (
        <div className="relative inline-flex flex-col gap-1" ref={dropdownRef}>
            {label && (
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    {label}
                </label>
            )}

            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(prev => !prev)}
                className={`h-[30px] px-2.5 text-xs bg-white border rounded-sm flex items-center justify-between gap-2 min-w-[150px] max-w-[220px] transition-all shadow-sm focus:outline-none focus:ring-1 focus:ring-primary ${
                    isOpen 
                        ? 'border-primary ring-1 ring-primary' 
                        : selectedCount > 0 
                            ? 'border-primary/60 text-slate-800 font-medium' 
                            : 'border-slate-300 text-slate-700 hover:border-slate-400'
                }`}
            >
                <span className="truncate text-left flex-1">
                    {triggerLabel}
                </span>

                <div className="flex items-center gap-1 flex-shrink-0">
                    {selectedCount > 0 && (
                        <span
                            role="button"
                            tabIndex={0}
                            onClick={handleQuickClear}
                            title="Clear items filter"
                            className="p-0.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </span>
                    )}
                    <svg
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-primary' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-72 bg-white rounded-md shadow-xl border border-slate-200 z-50 overflow-hidden flex flex-col text-slate-700 animate-in fade-in-50 duration-150">
                    {/* Search Header */}
                    <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                        <div className="relative">
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search items..."
                                className="w-full h-8 pl-8 pr-7 text-xs border border-slate-300 rounded focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                            />
                            <svg
                                className="w-4 h-4 text-slate-400 absolute left-2.5 top-2"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Quick Selection Actions */}
                        <div className="flex items-center justify-between mt-2 pt-1 text-[11px] text-slate-500 font-medium px-0.5">
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={handleSelectAll}
                                    className="text-primary hover:underline hover:text-primary-700 font-semibold"
                                >
                                    Select All ({filteredItems.length})
                                </button>
                                <span>•</span>
                                <button
                                    type="button"
                                    onClick={handleClearAll}
                                    className="text-slate-500 hover:underline hover:text-slate-700"
                                >
                                    Clear
                                </button>
                            </div>
                            <span className="text-[10px] text-slate-400">
                                {tempSelected.length} selected
                            </span>
                        </div>
                    </div>

                    {/* Items List */}
                    <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 py-1">
                        {filteredItems.length === 0 ? (
                            <div className="py-6 text-center text-xs text-slate-400">
                                No items match "{searchQuery}"
                            </div>
                        ) : (
                            filteredItems.map((item) => {
                                const isChecked = tempSelected.includes(item.id);
                                return (
                                    <label
                                        key={item.id}
                                        className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-slate-50 cursor-pointer text-xs transition-colors select-none"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => toggleItem(item.id)}
                                            className="w-3.5 h-3.5 text-primary border-slate-300 rounded focus:ring-primary focus:ring-1"
                                        />
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className={`truncate ${isChecked ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                                                {item.name}
                                            </span>
                                            {item.sku && (
                                                <span className="text-[10px] text-slate-400 truncate">
                                                    SKU: {item.sku}
                                                </span>
                                            )}
                                        </div>
                                    </label>
                                );
                            })
                        )}
                    </div>

                    {/* Footer / Apply Action */}
                    <div className="p-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setTempSelected(selectedIds || []);
                                setIsOpen(false);
                            }}
                            className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-800 font-medium hover:bg-slate-200/60 rounded transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleApply}
                            className="px-3 py-1 text-xs bg-primary hover:bg-primary-600 text-white font-semibold rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 transition-colors"
                        >
                            Apply Filter
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
