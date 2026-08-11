import React from 'react';

export default function BooksLockIndicator({ date, lockDate, isEdit = false }) {
    if (!isEdit || !lockDate || !date) return null;
    
    // Convert to simple YYYY-MM-DD for accurate comparison (ignore timezones)
    const compareDate = String(date).split('T')[0];
    const compareLockDate = String(lockDate).split('T')[0];
    
    if (compareDate > compareLockDate) return null;

    return (
        <div 
            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200 ml-2" 
            title="This transaction is dated on or before the books lock date. A PIN is required to save changes."
        >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Locked
        </div>
    );
}
