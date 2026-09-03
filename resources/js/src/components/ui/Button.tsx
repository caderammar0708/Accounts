import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    loading?: boolean;
    loadingText?: string;
    icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
    children,
    className = '',
    variant = 'primary',
    loading = false,
    loadingText,
    icon,
    disabled,
    type = 'button',
    ...props
}) => {
    // Core base layout and transition behavior
    const baseStyles = 'px-8 py-2.5 text-sm font-bold rounded-lg shadow-sm transition duration-150 disabled:opacity-50 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 active:scale-[0.98] select-none';
    
    let variantStyles = '';
    switch (variant) {
        case 'primary':
            variantStyles = 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white border border-transparent';
            break;
        case 'secondary':
            variantStyles = 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 shadow-sm';
            break;
        case 'danger':
            variantStyles = 'bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white border border-transparent';
            break;
        case 'ghost':
            variantStyles = 'bg-transparent hover:bg-slate-100 text-slate-650 hover:text-slate-900 border border-transparent';
            break;
        default:
            variantStyles = 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white border border-transparent';
    }

    return (
        <button
            type={type}
            disabled={disabled || loading}
            className={`${baseStyles} ${variantStyles} ${className}`}
            {...props}
        >
            {loading ? (
                <>
                    <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{loadingText || 'Saving...'}</span>
                </>
            ) : (
                <>
                    {icon && <span className="flex-shrink-0 inline-flex items-center justify-center">{icon}</span>}
                    <span>{children}</span>
                </>
            )}
        </button>
    );
};

export default Button;
