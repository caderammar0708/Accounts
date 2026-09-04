import React, { useState, useEffect, useRef } from 'react';

/**
 * Shared Currency / Monetary Input component.
 * Features:
 * - Formats with commas and 2 decimals on blur / display
 * - Strips commas on focus and selects all text
 * - Clean monospace right-aligned numbers
 * - Currency prefix indicator
 */
export default function CurrencyInput({
    label,
    value,
    onChange,
    error,
    placeholder = '0.00',
    prefix = '',
    required = false,
    disabled = false,
    size = 'md',
    className = '',
    inputClass = '',
    name,
    id,
}) {
    const inputRef = useRef(null);
    const [isFocused, setIsFocused] = useState(false);
    const [displayVal, setDisplayVal] = useState('');

    const formatCurrency = (val) => {
        if (val === null || val === undefined || val === '') return '';
        const num = parseFloat(String(val).replace(/,/g, ''));
        if (isNaN(num)) return '';
        return num.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    useEffect(() => {
        if (!isFocused) {
            setDisplayVal(formatCurrency(value));
        }
    }, [value, isFocused]);

    const handleFocus = (e) => {
        setIsFocused(true);
        const plain = String(value ?? '').replace(/,/g, '');
        setDisplayVal(plain === '0' || plain === '0.00' ? '' : plain);
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.select();
            }
        }, 0);
    };

    const handleChange = (e) => {
        const raw = e.target.value;
        setDisplayVal(raw);
        const clean = raw.replace(/,/g, '');
        if (onChange) {
            onChange(clean);
        }
    };

    const handleBlur = () => {
        setIsFocused(false);
        setDisplayVal(formatCurrency(displayVal));
    };

    const sizeClasses = {
        sm: 'h-[30px] text-xs py-1',
        md: 'h-[30px] text-xs py-1',
        lg: 'h-[36px] text-sm py-1.5',
    };

    return (
        <div className={`flex flex-col ${className}`}>
            {label && (
                <label className="font-bold text-slate-600 text-xs mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}

            <div className="relative flex items-center">
                {prefix && (
                    <span className="absolute left-2.5 text-[11px] font-bold text-slate-400 pointer-events-none select-none">
                        {prefix}
                    </span>
                )}

                <input
                    ref={inputRef}
                    id={id}
                    name={name}
                    type="text"
                    inputMode="decimal"
                    value={displayVal}
                    onFocus={handleFocus}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`w-full border border-slate-300 bg-white font-mono text-right text-slate-900 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 shadow-sm rounded-sm disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-all ${
                        prefix ? 'pl-10 pr-2.5' : 'px-2.5'
                    } ${sizeClasses[size] || sizeClasses.md} ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : ''} ${inputClass}`}
                />
            </div>

            {error && (
                <p className="text-xs font-bold text-red-500 flex items-center gap-1 ml-0.5 mt-1">
                    {error}
                </p>
            )}
        </div>
    );
}
