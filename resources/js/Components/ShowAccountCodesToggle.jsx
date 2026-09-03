import React, { useState } from 'react';

/**
 * Helper to format account names for reports with optional account code prefix.
 * E.g. "4022 - Sales Card - Chilaw" or "Sales Card - Chilaw" if no code or disabled.
 *
 * @param {Object|string} accountOrName - Account object ({ name, account_code }) or account name string
 * @param {string|null} code - Account code if accountOrName is a string
 * @param {boolean} showCode - Whether to show account code prefix
 * @returns {string} Formatted account label
 */
export function formatAccountDisplayName(accountOrName, code = null, showCode = false) {
    if (!accountOrName) return '';

    let name = '';
    let accountCode = code;

    if (typeof accountOrName === 'object') {
        name = accountOrName.name || '';
        accountCode = accountOrName.account_code ?? code;
    } else {
        name = String(accountOrName);
    }

    // Skip adding code prefix for subtotal/group-total rows starting with "Total"
    const trimmed = name.trim();
    if (/^total\b/i.test(trimmed)) {
        return name;
    }

    if (showCode && accountCode && String(accountCode).trim() !== '') {
        return `${String(accountCode).trim()} - ${name}`;
    }

    return name;
}

/**
 * Custom hook to manage the "Show Account Codes" toggle state.
 * Persists in URL search params (?show_codes=1) and localStorage so it survives navigation,
 * date changes, reload, and drilldowns.
 */
export function useAccountCodesToggle(initialState = null) {
    const [showAccountCodes, setShowAccountCodes] = useState(() => {
        if (typeof window === 'undefined') return false;
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('show_codes')) {
            const val = urlParams.get('show_codes');
            return val === '1' || val === 'true';
        }
        if (initialState !== null && initialState !== undefined) {
            return Boolean(initialState);
        }
        return localStorage.getItem('reports_show_account_codes') === '1';
    });

    const toggleShowAccountCodes = () => {
        setShowAccountCodes(prev => {
            const next = !prev;
            try {
                localStorage.setItem('reports_show_account_codes', next ? '1' : '0');
                const url = new URL(window.location.href);
                if (next) {
                    url.searchParams.set('show_codes', '1');
                } else {
                    url.searchParams.delete('show_codes');
                }
                window.history.replaceState({}, '', url.toString());
            } catch (_) {}
            return next;
        });
    };

    return [showAccountCodes, toggleShowAccountCodes];
}

/**
 * Reusable header toggle button placed alongside date range inputs & View by Month button.
 */
export default function ShowAccountCodesToggle({ enabled, onToggle, className = '' }) {
    return (
        <button
            type="button"
            onClick={onToggle}
            className={`inline-flex items-center h-[30px] !px-3 mb-[1px] rounded-md text-xs font-semibold transition-all border shadow-sm select-none ${
                enabled
                    ? 'bg-primary-50 border-primary-300 text-primary-700 hover:bg-primary-100 ring-2 ring-primary-500/10'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            } ${className}`}
            title={enabled ? "Hide account codes" : "Show account codes (e.g. 4022 - Account Name)"}
        >
            <span
                className={`w-2 h-2 rounded-full mr-2 transition-colors ${
                    enabled ? 'bg-primary-600 ring-2 ring-primary-200' : 'bg-slate-300'
                }`}
            />
            Show Account Codes
        </button>
    );
}
