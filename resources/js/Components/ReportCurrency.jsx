import React from 'react';

export default function ReportCurrency({ value, currency = '', className = '' }) {
    const num = typeof value === 'number' ? value : parseFloat(value || 0);
    if (isNaN(num)) return <span>-</span>;

    const isNegative = num < 0;
    const formatted = Math.abs(num).toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    });

    return (
        <span className={`inline-flex items-baseline justify-end whitespace-nowrap tabular-nums leading-normal ${isNegative ? 'text-red-600' : 'text-slate-900'} ${className}`}>
            {currency && (
                <span className="text-[10px] font-bold text-slate-400 mr-1 select-none flex-shrink-0">
                    {currency}
                </span>
            )}
            <span className="flex-shrink-0">
                {isNegative ? `-${formatted}` : formatted}
            </span>
        </span>
    );
}
