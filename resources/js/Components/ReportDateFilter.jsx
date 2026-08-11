import React, { useState, useEffect } from 'react';
import CommonInput from './CommonInput';
import { Link, usePage } from '@inertiajs/react';

export default function ReportDateFilter({ currentFilter, onFilterChange }) {
    const { auth } = usePage().props;
    const [filterType, setFilterType] = useState('custom');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Date formatting helper YYYY-MM-DD
    const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
        const year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [year, month, day].join('-');
    };

    const getCurrentMonthRange = () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return {
            start: formatDate(start),
            end: formatDate(end),
        };
    };

    // ── sessionStorage helpers ────────────────────────────────────────────────
    const SESSION_KEY = 'reportDateFilter';

    const saveToSession = (type, start, end) => {
        try {
            sessionStorage.setItem(SESSION_KEY, JSON.stringify({ type, start_date: start, end_date: end }));
        } catch (_) {}
    };

    const loadFromSession = () => {
        try {
            const raw = sessionStorage.getItem(SESSION_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (_) {
            return null;
        }
    };
    // ─────────────────────────────────────────────────────────────────────────

    const handleApply = (type, customStart, customEnd) => {
        let start = '';
        let end = '';
        const today = new Date();
        const y = today.getFullYear();
        const m = today.getMonth();

        switch (type) {
            case 'all_dates':
                start = '';
                end = '';
                break;
            case 'today':
                start = formatDate(today);
                end = formatDate(today);
                break;
            case 'this_week':
                const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
                const lastDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
                start = formatDate(firstDayOfWeek);
                end = formatDate(lastDayOfWeek);
                break;
            case 'last_week':
                const lastWeekToday = new Date(new Date().setDate(new Date().getDate() - 7));
                const firstDayOfLastWeek = new Date(lastWeekToday.setDate(lastWeekToday.getDate() - lastWeekToday.getDay()));
                const lastDayOfLastWeek = new Date(lastWeekToday.setDate(lastWeekToday.getDate() - lastWeekToday.getDay() + 6));
                start = formatDate(firstDayOfLastWeek);
                end = formatDate(lastDayOfLastWeek);
                break;
            case 'this_month':
                start = formatDate(new Date(y, m, 1));
                end = formatDate(new Date(y, m + 1, 0));
                break;
            case 'last_month':
                start = formatDate(new Date(y, m - 1, 1));
                end = formatDate(new Date(y, m, 0));
                break;
            case 'this_quarter':
                const q = Math.floor(m / 3);
                start = formatDate(new Date(y, q * 3, 1));
                end = formatDate(new Date(y, q * 3 + 3, 0));
                break;
            case 'last_quarter':
                const lq = Math.floor(m / 3) - 1;
                const lqy = lq < 0 ? y - 1 : y;
                const lqm = lq < 0 ? 3 : lq;
                start = formatDate(new Date(lqy, lqm * 3, 1));
                end = formatDate(new Date(lqy, lqm * 3 + 3, 0));
                break;
            case 'this_half_year':
                const hy = Math.floor(m / 6);
                start = formatDate(new Date(y, hy * 6, 1));
                end = formatDate(new Date(y, hy * 6 + 6, 0));
                break;
            case 'last_half_year':
                const lhy = Math.floor(m / 6) - 1;
                const lhyy = lhy < 0 ? y - 1 : y;
                const lhym = lhy < 0 ? 1 : lhy;
                start = formatDate(new Date(lhyy, lhym * 6, 1));
                end = formatDate(new Date(lhyy, lhym * 6 + 6, 0));
                break;
            case 'this_year':
                start = formatDate(new Date(y, 0, 1));
                end = formatDate(new Date(y, 11, 31));
                break;
            case 'last_year':
                start = formatDate(new Date(y - 1, 0, 1));
                end = formatDate(new Date(y - 1, 11, 31));
                break;
            case 'this_financial_year': {
                const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                const finStartMonthStr = auth?.financial_year_start_month || 'April';
                let finStartMonthIdx = monthNames.indexOf(finStartMonthStr);
                if (finStartMonthIdx < 0) finStartMonthIdx = 3; // Default to April
                
                let fyStartYear = y;
                if (m < finStartMonthIdx) {
                    fyStartYear = y - 1;
                }
                start = formatDate(new Date(fyStartYear, finStartMonthIdx, 1));
                end = formatDate(new Date(fyStartYear + 1, finStartMonthIdx, 0));
                break;
            }
            case 'last_financial_year': {
                const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                const finStartMonthStr = auth?.financial_year_start_month || 'April';
                let finStartMonthIdx = monthNames.indexOf(finStartMonthStr);
                if (finStartMonthIdx < 0) finStartMonthIdx = 3;
                
                let lfyStartYear = y - 1;
                if (m < finStartMonthIdx) {
                    lfyStartYear = y - 2;
                }
                start = formatDate(new Date(lfyStartYear, finStartMonthIdx, 1));
                end = formatDate(new Date(lfyStartYear + 1, finStartMonthIdx, 0));
                break;
            }
            case 'custom':
                start = customStart || startDate;
                end = customEnd || endDate;
                break;
        }

        setFilterType(type);
        setStartDate(start);
        setEndDate(end);

        // Persist the selection so switching to another report keeps it applied
        saveToSession(type, start, end);

        if (onFilterChange) {
            onFilterChange({ start_date: start, end_date: end, type: type });
        }
    };

    // On mount: initialise local state. If the server provided an explicit filter
    // type via URL params, honour it. Otherwise restore the last filter the user
    // chose in another report (sessionStorage), so the date doesn't reset when
    // switching between reports. Falls back to current-month if nothing is saved.
    useEffect(() => {
        if (currentFilter) {
            if (currentFilter.type) {
                // Server-driven filter (user navigated with query params) — honour it.
                setFilterType(currentFilter.type);
                const defaultRange = getCurrentMonthRange();
                setStartDate(currentFilter.start_date ?? defaultRange.start);
                setEndDate(currentFilter.end_date ?? defaultRange.end);
                return;
            }

            // No explicit type from server — try to restore the previously saved filter.
            const saved = loadFromSession();
            if (saved && saved.type) {
                // Auto-apply so the report re-fetches with the persisted dates.
                handleApply(saved.type, saved.start_date, saved.end_date);
                return;
            }

            // No saved filter — fall back to current-month defaults.
            const defaultRange = getCurrentMonthRange();
            setStartDate(currentFilter.start_date ?? defaultRange.start);
            setEndDate(currentFilter.end_date ?? defaultRange.end);
        }
    }, []); // Run only on mount — each Inertia navigation creates a fresh component instance

    return (
        <div className="flex flex-row items-center gap-2 flex-wrap">
            <Link
                href={route('reports.index')}
                className="flex items-center justify-center w-[30px] h-[30px] border border-slate-300 rounded-sm text-slate-500 hover:text-gray-900 bg-white shadow-sm hover:bg-slate-50 transition-colors shrink-0"
                title="Back to Reports"
            >
                <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </Link>
            <div className="w-36">
                <select
                    value={filterType}
                    onChange={(e) => {
                        setFilterType(e.target.value);
                        if (e.target.value !== 'custom') {
                            handleApply(e.target.value);
                        }
                    }}
                    title="Date Range"
                    className="w-full h-[30px] py-0 border border-slate-300 rounded-sm text-xs focus:ring-green-500/20 focus:border-green-500 transition-colors bg-white cursor-pointer shadow-sm text-slate-900"
                >
                    <option value="all_dates">All Dates</option>
                    <option value="custom">Custom Date</option>
                    <option value="today">Today</option>
                    <option value="this_week">This week</option>
                    <option value="last_week">Last week</option>
                    <option value="this_month">This Month</option>
                    <option value="last_month">Last month</option>
                    <option value="this_quarter">This Quarter</option>
                    <option value="last_quarter">Last Quarter</option>
                    <option value="this_half_year">This Half Year</option>
                    <option value="last_half_year">Last Half Year</option>
                    <option value="this_year">This Year</option>
                    <option value="last_year">Last Year</option>
                    <option value="this_financial_year">This Financial Year</option>
                    <option value="last_financial_year">Last Financial Year</option>
                </select>
            </div>

            {filterType === 'custom' && (
                <>
                    <div className="w-28">
                        <CommonInput
                            type="date"
                            value={startDate}
                            onChange={(e) => {
                                const newStart = e.target.value;
                                setStartDate(newStart);
                                
                                if (newStart) {
                                    const [y, m, day] = newStart.split('-');
                                    const d = new Date(y, m - 1, day);
                                    
                                    d.setFullYear(d.getFullYear() + 1);
                                    d.setDate(d.getDate() - 1);
                                    
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    d.setHours(0, 0, 0, 0);
                                    
                                    const end = d > today ? today : d;
                                    setEndDate(formatDate(end));
                                }
                            }}
                        />
                    </div>
                    <div className="w-28">
                        <CommonInput
                            type="date"
                            value={endDate}
                            onChange={(e) => {
                                setEndDate(e.target.value);
                            }}
                        />
                    </div>
                    <div>
                        <button
                            type="button"
                            onClick={() => handleApply('custom', startDate, endDate)}
                            className="h-[30px] px-3 bg-primary text-white text-xs font-semibold rounded-sm hover:bg-primary-600 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors shadow-sm"
                        >
                            Apply
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
