import { Link } from '@inertiajs/react';

/**
 * A unified, premium button component for the entire application.
 * Change styles here to update globally.
 */
export default function CommonButton({
    type = 'button',
    variant = 'primary',
    size = 'md',
    className = '',
    processing,
    children,
    onClick,
    href,
    ...props
}) {
    const variants = {
        primary: 'bg-primary text-white hover:bg-primary-600 border-primary shadow-sm',
        secondary: 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200 shadow-sm',
        danger: 'bg-red-600 text-white hover:bg-red-700 border-red-600 shadow-sm',
        outline: 'bg-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 border-slate-200',
        ghost: 'bg-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50 border-transparent',
        custom: '',
    };

    const sizes = {
        xs: 'px-2 py-0.5 text-[9px]',
        sm: 'px-2.5 py-1 text-[10px]',
        md: 'px-3 py-1.5 text-[11px]',
        lg: 'px-4.5 py-2 text-xs',
        none: '',
    };

    const baseClasses = variant === 'custom' ? `${className}` : `inline-flex items-center justify-center font-bold uppercase tracking-widest rounded-md border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`;

    if (href) {
        return (
            <Link href={href} className={baseClasses} {...props}>
                {children}
            </Link>
        );
    }

    return (
        <button
            type={type}
            onClick={onClick}
            className={baseClasses}
            disabled={processing}
            {...props}
        >
            {processing && (
                <svg className="animate-spin -ml-1 mr-2 h-3 w-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            {children}
        </button>
    );
}
