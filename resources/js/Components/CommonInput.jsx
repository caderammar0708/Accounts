import { forwardRef, useEffect, useRef, useState, useImperativeHandle } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import SearchableSelect from './SearchableSelect';

/**
 * A highly reusable, premium input component for JBooks.
 * Supports text, number, date, select, textarea, etc.
 */
export default forwardRef(function CommonInput(
    {
        type = 'text',
        label,
        error,
        className = '',
        isFocused = false,
        containerClass = '',
        options = [], // for select type
        required = false,
        icon,
        size = 'md', // 'sm', 'md', 'lg'
        variant = 'boxed', // 'boxed', 'table', 'underlined'
        inputClass = '',
        children,
        dateFormat,
        value,
        ...props
    },
    ref
) {
    const inputRef = useRef(null);
    const datePickerRef = useRef(null);
    const [showPassword, setShowPassword] = useState(false);
    const resolvedDateFormat = dateFormat || 'DD/MM/YYYY';

    useImperativeHandle(ref, () => ({
        focus: () => {
            if (type === 'date') {
                datePickerRef.current?.setFocus();
            } else {
                inputRef.current?.focus();
            }
        },
        open: () => {
            if (type === 'date') {
                datePickerRef.current?.setOpen(true);
            }
        },
        showPicker: () => {
            if (type === 'date') {
                datePickerRef.current?.setOpen(true);
            } else {
                inputRef.current?.showPicker?.();
            }
        }
    }));

    useEffect(() => {
        if (isFocused) {
            if (type === 'date') {
                datePickerRef.current?.setFocus();
            } else {
                inputRef.current?.focus();
            }
        }
    }, [isFocused, type]);

    const sizeClasses = {
        sm: "h-[30px] text-xs px-2 rounded-sm",
        md: "h-[30px] text-xs px-2 rounded-sm",
        lg: "h-[30px] text-xs px-2 rounded-sm"
    };

    const variantClasses = {
        boxed: "border border-slate-300 bg-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 shadow-sm",
        table: "border-none bg-transparent focus:bg-green-50/30 focus:ring-0 rounded-none h-8 px-2 py-0 text-xs",
        underlined: "border-b border-slate-300 bg-transparent focus:border-green-500 focus:ring-0 rounded-none px-0"
    };

    const baseInputClasses = `w-full text-slate-900 transition-all placeholder:text-slate-400 ${variant !== 'table' ? (type === 'textarea' ? 'text-xs px-2 rounded-sm' : sizeClasses[size]) : ''} ${variantClasses[variant]}`;
    const errorClasses = error ? "border-red-300 focus:border-red-500 focus:ring-red-500/10" : "";

    const showPicker = () => {
        if (type === 'date' && datePickerRef.current) {
            datePickerRef.current.setOpen(true);
            return;
        }
        if (inputRef.current) {
            try {
                inputRef.current.showPicker();
            } catch (e) {
                inputRef.current.focus();
            }
        }
    };

    const renderIcon = () => {
        if (type === 'password') {
            return (
                <button
                    type="button"
                    className={`absolute ${size === 'sm' || variant === 'table' ? 'right-1.5' : 'right-3'} top-1/2 -translate-y-1/2 text-slate-400 hover:text-green-500 transition-colors z-10`}
                    onClick={(e) => {
                        e.preventDefault();
                        setShowPassword(prev => !prev);
                    }}
                >
                    {showPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.258m1.902-1.902A9.96 9.96 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21m-5.875-5.125A3.377 3.377 0 0112 15a3.375 3.375 0 01-3.375-3.375c0-.588.181-1.134.488-1.587M12 9a3.375 3.375 0 013.375 3.375" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    )}
                </button>
            );
        }
        if (type === 'date') {
            return (
                <div
                    className={`absolute ${size === 'sm' || variant === 'table' ? 'right-1.5' : 'right-3'} top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-green-500 transition-colors z-10`}
                    onClick={(e) => {
                        e.stopPropagation();
                        showPicker();
                    }}
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
            );
        }
        if (icon) {
            return (
                <div className={`absolute ${size === 'sm' || variant === 'table' ? 'right-1.5' : 'right-3'} top-1/2 -translate-y-1/2 pointer-events-none text-slate-400`}>
                    {icon}
                </div>
            );
        }
        return null;
    };

    const getDatePlaceholder = () => {
        const format = String(resolvedDateFormat || 'DD/MM/YYYY').toUpperCase();
        if (format.includes('DD/MM')) return 'DD/MM/YYYY';
        if (format.includes('DD-MM')) return 'DD-MM-YYYY';
        if (format.includes('YYYY')) return 'YYYY-MM-DD';
        return 'DD/MM/YYYY';
    };

    const handlePaste = (e) => {
        if (type === 'date') {
            const pastedText = e.clipboardData.getData('text').trim();

            const d = new Date(pastedText);

            if (!isNaN(d.getTime())) {
                e.preventDefault();

                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                const formatted = `${yyyy}-${mm}-${dd}`;

                handleDateChange(d);
            }
        }
    };

    const normalizedValue = value !== undefined ? value : (props.value ?? '');

    let selectedDate = null;
    if (normalizedValue && typeof normalizedValue === 'string') {
        const parts = normalizedValue.split('-');
        if (parts.length === 3) {
            selectedDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        } else {
            const d = new Date(normalizedValue);
            if (!isNaN(d.getTime())) selectedDate = d;
        }
    } else if (normalizedValue instanceof Date) {
        selectedDate = normalizedValue;
    }

    const handleDateChange = (date) => {
        if (props.onChange) {
            let dateStr = '';
            if (date) {
                const yyyy = date.getFullYear();
                const mm = String(date.getMonth() + 1).padStart(2, '0');
                const dd = String(date.getDate()).padStart(2, '0');
                dateStr = `${yyyy}-${mm}-${dd}`;
            }
            props.onChange({
                target: {
                    name: props.name,
                    value: dateStr
                }
            });
        }
    };

    return (
        <div
            className={`flex flex-col gap-0.5 ${containerClass} ${variant === 'table' ? 'h-full' : ''}`}
        >
            {label && (
                <label className="font-bold text-slate-600 ml-0.5 text-xs mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}

            <div className={`relative ${variant === 'table' ? 'h-full' : ''}`}>
                {type === 'textarea' ? (
                    <textarea
                        {...props}
                        value={normalizedValue}
                        ref={inputRef}
                        className={`${baseInputClasses} ${errorClasses} py-1.5 resize-y ${className} ${inputClass}`}
                    />
                ) : type === 'select' ? (
                    <select
                        {...props}
                        value={normalizedValue}
                        ref={inputRef}
                        className={`${baseInputClasses} ${errorClasses} py-0 pl-2 pr-8 ${className} ${inputClass}`}
                    >
                        {children ? children : options.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                ) : type === 'date' ? (
                    <div className="relative w-full h-full group">
                        <style>{`
                            .react-datepicker__day--outside-month {
                                visibility: hidden;
                            }
                        `}</style>
                        <DatePicker
                            ref={datePickerRef}
                            selected={selectedDate}
                            onChange={handleDateChange}
                            dateFormat={resolvedDateFormat.toLowerCase().replace(/m/g, 'M').replace(/d/g, 'd').replace(/y/g, 'y')}
                            placeholderText={getDatePlaceholder()}
                            className={`${baseInputClasses} ${errorClasses} ${className} ${inputClass} pr-8 focus:ring-2 focus:ring-green-500/20 focus:border-green-500`}
                            autoComplete="off"
                            name={props.name}
                            id={props.id}
                            disabled={props.disabled}
                            readOnly={props.readOnly}
                            required={props.required}
                            onPaste={props.onPaste || handlePaste}
                            showOutsideDays={false}
                            renderCustomHeader={({
                                date,
                                changeYear,
                                changeMonth,
                                decreaseMonth,
                                increaseMonth,
                                prevMonthButtonDisabled,
                                nextMonthButtonDisabled,
                            }) => (
                                <div className="flex items-center justify-between px-1 py-1 gap-1 w-full">
                                    <button
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); decreaseMonth(); }}
                                        disabled={prevMonthButtonDisabled}
                                        type="button"
                                        className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 transition-colors disabled:opacity-25 disabled:pointer-events-none"
                                        title="Previous Month"
                                        aria-label="Previous Month"
                                    >
                                        <svg className="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>

                                    <div className="flex items-center justify-center gap-1.5 min-w-0 flex-1">
                                        <div className="w-[115px] flex-shrink-0">
                                            <SearchableSelect
                                                value={date.getMonth()}
                                                onChange={(val) => changeMonth(Number(val))}
                                                options={[
                                                    { value: 0, label: "January" },
                                                    { value: 1, label: "February" },
                                                    { value: 2, label: "March" },
                                                    { value: 3, label: "April" },
                                                    { value: 4, label: "May" },
                                                    { value: 5, label: "June" },
                                                    { value: 6, label: "July" },
                                                    { value: 7, label: "August" },
                                                    { value: 8, label: "September" },
                                                    { value: 9, label: "October" },
                                                    { value: 10, label: "November" },
                                                    { value: 11, label: "December" }
                                                ]}
                                                size="sm"
                                                placeholder="Month"
                                            />
                                        </div>

                                        <div className="w-[76px] flex-shrink-0">
                                            <SearchableSelect
                                                value={date.getFullYear()}
                                                onChange={(val) => changeYear(Number(val))}
                                                onSearch={(query) => {
                                                    if (!query) {
                                                        return Array.from({ length: 13 }, (_, i) => {
                                                            const yr = new Date().getFullYear() + 2 - i;
                                                            return { value: yr, label: String(yr) };
                                                        });
                                                    }
                                                    return Array.from({ length: 151 }, (_, i) => {
                                                        const yr = new Date().getFullYear() + 50 - i;
                                                        return { value: yr, label: String(yr) };
                                                    });
                                                }}
                                                options={Array.from({ length: 13 }, (_, i) => {
                                                    const yr = new Date().getFullYear() + 2 - i;
                                                    return { value: yr, label: String(yr) };
                                                })}
                                                allowCustom={true}
                                                size="sm"
                                                placeholder="Year"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); increaseMonth(); }}
                                        disabled={nextMonthButtonDisabled}
                                        type="button"
                                        className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 transition-colors disabled:opacity-25 disabled:pointer-events-none"
                                        title="Next Month"
                                        aria-label="Next Month"
                                    >
                                        <svg className="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                            customInput={
                                <input ref={inputRef} />
                            }
                        />
                    </div>
                ) : (
                    <input
                        {...props}
                        value={normalizedValue}
                        type={type === 'password' ? (showPassword ? 'text' : 'password') : type}
                        ref={inputRef}
                        onPaste={props.onPaste || handlePaste}
                        placeholder={props.placeholder}
                        className={`${baseInputClasses} ${errorClasses} ${className} ${inputClass} ${(type === 'password' || icon) ? 'pr-8' : ''}`}
                    />
                )}
                {renderIcon()}
            </div>

            {error && (
                <p className="text-xs font-bold text-red-500 items-center flex gap-1 ml-1 mt-0.5">
                    {error}
                </p>
            )}
        </div>
    );
});
