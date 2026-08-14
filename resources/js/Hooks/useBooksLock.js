import { useState, useEffect } from 'react';

/**
 * Utility function to check if a transaction date falls on or before books_lock_date in edit mode.
 */
export function isBooksLocked(date, lockDate, isEdit = true) {
    if (!isEdit || !lockDate || !date) return false;
    const compareDate = String(date).split('T')[0];
    const compareLockDate = String(lockDate).split('T')[0];
    return compareDate <= compareLockDate;
}

/**
 * Custom hook to handle books-lock PIN modal state for transaction forms.
 * 
 * @param {object} errors - Inertia form errors object
 * @returns {object} { isPinModalOpen, setIsPinModalOpen, pendingAction, setPendingAction, isBooksLocked }
 */
export function useBooksLock(errors = {}) {
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);

    useEffect(() => {
        if (errors.books_pin) {
            setIsPinModalOpen(true);
        }
    }, [errors.books_pin]);

    return {
        isPinModalOpen,
        setIsPinModalOpen,
        pendingAction,
        setPendingAction,
        isBooksLocked,
    };
}

