import React, { useState, useMemo } from 'react';
import ReportLayout from '@/Layouts/ReportLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useDateFormat, formatDate } from '@/Utils/dateFormat';
import { getEditRoute } from '@/Utils/routeUtils';
import ReportDateFilter from '@/Components/ReportDateFilter';

export default function AllContactBalanceDetail({ reportData = [], contactType, filters = {} }) {
    const { auth } = usePage().props;
    const currencyPrefix = auth.company?.home_currency_prefix || auth.company?.home_currency || '';
    const dateFormat = useDateFormat();

    // Default to all expanded, since detail reports usually show details. 
    // State tracks which contacts are collapsed by their ID.
    const [collapsedGroups, setCollapsedGroups] = useState(new Set());
    const [sortField, setSortField] = useState('date');
    const [sortDirection, setSortDirection] = useState('asc');

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const toggleGroup = (id) => {
        setCollapsedGroups(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleFilterChange = (newFilters) => {
        const routeName = contactType === 'Customer' ? 'reports.customer-balance-detail' : 'reports.supplier-balance-detail';
        router.get(route(routeName), {
            start_date: newFilters.start_date,
            end_date: newFilters.end_date,
            type: newFilters.type
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const filterElements = (
        <ReportDateFilter
            currentFilter={{ start_date: filters.start_date, end_date: filters.end_date, type: filters.type }}
            onFilterChange={handleFilterChange}
        />
    );

    // Process data to calculate running balances per contact and apply sorting
    const processedData = useMemo(() => {
        return reportData.map(group => {
            let currentBalance = parseFloat(group.contact.opening_balance || 0);

            const linesWithBalance = group.lines.map(line => {
                const debit = parseFloat(line.debit || 0);
                const credit = parseFloat(line.credit || 0);
                let amount = 0;
                if (contactType === 'Customer') {
                    amount = debit - credit;
                } else {
                    amount = credit - debit;
                }
                currentBalance += amount;
                return {
                    ...line,
                    amount,
                    running_balance: currentBalance
                };
            });

            const sortedLines = [...linesWithBalance].sort((a, b) => {
                let comparison = 0;
                if (sortField === 'date') {
                    comparison = (a.date || '').localeCompare(b.date || '');
                    if (comparison === 0) {
                        comparison = (a.id || '').localeCompare(b.id || '');
                    }
                } else if (sortField === 'transaction_type') {
                    const typeA = (a.transaction_type || '').toLowerCase();
                    const typeB = (b.transaction_type || '').toLowerCase();
                    comparison = typeA.localeCompare(typeB);
                    if (comparison === 0) {
                        comparison = (a.date || '').localeCompare(b.date || '');
                    }
                } else if (sortField === 'number') {
                    comparison = (a.number || '').localeCompare(b.number || '', undefined, { numeric: true });
                } else if (sortField === 'due_date') {
                    comparison = (a.due_date || '').localeCompare(b.due_date || '');
                } else if (sortField === 'amount') {
                    comparison = parseFloat(a.amount || 0) - parseFloat(b.amount || 0);
                } else if (sortField === 'balance') {
                    comparison = parseFloat(a.running_balance || 0) - parseFloat(b.running_balance || 0);
                }

                return sortDirection === 'desc' ? -comparison : comparison;
            });

            return {
                ...group,
                lines: sortedLines,
                final_balance: currentBalance
            };
        });
    }, [reportData, contactType, sortField, sortDirection]);

    // Calculate Grand Total
    const grandTotal = useMemo(() => {
        return processedData.reduce((sum, group) => sum + group.final_balance, 0);
    }, [processedData]);

    const formatCurrency = (val) => {
        const prefix = currencyPrefix ? `${currencyPrefix} ` : '';
        if (val < 0) return <span className="text-red-600">{currencyPrefix ? `${currencyPrefix} -` : '-'}{Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
        return <span>{prefix}{val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
    };

    const SortableHeader = ({ field, label, align = 'left', className = '' }) => {
        const isActive = sortField === field;
        return (
            <th 
                onClick={() => handleSort(field)}
                className={`py-2.5 px-3 font-semibold text-gray-900 cursor-pointer select-none hover:bg-slate-100 hover:text-primary transition-colors group ${className} ${align === 'right' ? 'text-right' : 'text-left'}`}
                title={`Click to sort by ${label} (${isActive && sortDirection === 'asc' ? 'descending' : 'ascending'})`}
            >
                <div className={`inline-flex items-center gap-1.5 ${align === 'right' ? 'justify-end w-full' : ''}`}>
                    <span>{label}</span>
                    <span className={`inline-flex text-[11px] leading-none ${isActive ? 'text-primary font-bold' : 'text-slate-300 opacity-0 group-hover:opacity-100'} transition-opacity`}>
                        {isActive ? (sortDirection === 'asc' ? '▲' : '▼') : '▲'}
                    </span>
                </div>
            </th>
        );
    };

    return (
        <ReportLayout
            title={`${contactType} Balance Detail`}
            filters={filterElements}
        >
            <Head title={`${contactType} Balance Detail`} />

            <div className="text-center mb-8 font-serif relative">
                <h2 className="text-xl font-bold text-gray-900">{auth.company?.company_name || 'Company'}</h2>
                <h3 className="text-lg text-gray-800 mt-1">{contactType} Balance Detail</h3>
                {filters.start_date && filters.end_date ? (
                    <p className="text-[13px] text-gray-500 mt-1">
                        {formatDate(filters.start_date, dateFormat)} - {formatDate(filters.end_date, dateFormat)}
                    </p>
                ) : (
                    <p className="text-[13px] text-gray-500 mt-1">
                        All Dates
                    </p>
                )}
            </div>

            <div className="w-full overflow-x-auto pb-10">
                <table className="w-full text-[13px] text-left border-collapse table-fixed">
                    <thead>
                        <tr className="border-y-2 border-gray-300">
                            <SortableHeader field="date" label="Date" className="w-[15%]" />
                            <SortableHeader field="transaction_type" label="Transaction type" className="w-[20%]" />
                            <SortableHeader field="number" label="Number" className="w-[15%]" />
                            <SortableHeader field="due_date" label="Due date" className="w-[15%]" />
                            <SortableHeader field="amount" label="Amount" align="right" className="w-[15%]" />
                            <SortableHeader field="balance" label="Balance" align="right" className="w-[20%]" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {processedData.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="py-8 text-center text-gray-500">
                                    No records found for this period.
                                </td>
                            </tr>
                        ) : (
                            processedData.map((group) => {
                                const displayName = group.contact.display_name || group.contact.company_name;
                                const isCollapsed = collapsedGroups.has(group.contact.id);
                                return (
                                    <React.Fragment key={group.contact.id}>
                                        {/* Group Header Row */}
                                        <tr
                                            className="bg-slate-50/50 hover:bg-slate-100 cursor-pointer transition-colors"
                                            onClick={() => toggleGroup(group.contact.id)}
                                        >
                                            <td colSpan="6" className="py-2 px-3 font-bold text-gray-800">
                                                <div className="flex items-center gap-2 whitespace-nowrap">
                                                    <svg
                                                        className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${isCollapsed ? '' : 'rotate-90'}`}
                                                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                                    </svg>
                                                    <span className="truncate">{displayName}</span>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Opening Balance Line (if details are expanded and there's an opening balance) */}
                                        {!isCollapsed && parseFloat(group.contact.opening_balance || 0) !== 0 && (
                                            <tr className="bg-white">
                                                <td className="py-2 px-3 text-gray-500 italic pl-10" colSpan="4">
                                                    Opening Balance
                                                </td>
                                                <td className="py-2 px-3 text-right tabular-nums text-gray-900">
                                                    {/* Empty amount column for opening balance line */}
                                                </td>
                                                <td className="py-2 px-3 text-right tabular-nums font-medium text-gray-900">
                                                    {formatCurrency(parseFloat(group.contact.opening_balance || 0))}
                                                </td>
                                            </tr>
                                        )}

                                        {/* Transaction Lines */}
                                        {!isCollapsed && group.lines.map((tx) => (
                                            <tr key={tx.id} className="hover:bg-slate-50 transition-colors bg-white">
                                                <td className="py-2 px-3 text-gray-600 pl-10">
                                                    {tx.date}
                                                </td>
                                                <td className="py-2 px-3 text-gray-600 capitalize">
                                                    {tx.transaction_type ? tx.transaction_type.replace('_', ' ') : 'Journal Entry'}
                                                </td>
                                                <td className="py-2 px-3 text-gray-600">
                                                    {tx.reference || '-'}
                                                </td>
                                                <td className="py-2 px-3 text-gray-600">
                                                    {tx.due_date || '-'}
                                                </td>
                                                <td className="py-2 px-3 text-right tabular-nums text-gray-900">
                                                    <Link href={route(getEditRoute(tx.transaction_type), tx.journal_entry_id)} className="text-indigo-600 hover:text-indigo-900 hover:underline">
                                                        {formatCurrency(tx.amount)}
                                                    </Link>
                                                </td>
                                                <td className="py-2 px-3 text-right tabular-nums font-medium text-gray-900">
                                                    <Link href={route(getEditRoute(tx.transaction_type), tx.journal_entry_id)} className="text-indigo-600 hover:text-indigo-900 hover:underline">
                                                        {formatCurrency(tx.running_balance)}
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}

                                        {/* Group Footer Total (only show if expanded and has lines) */}
                                        {!isCollapsed && group.lines.length > 0 && (
                                            <tr className="border-t border-gray-100 bg-white">
                                                <td colSpan="4" className="py-2 px-3 font-semibold text-gray-700 pl-10">
                                                    Total for {displayName}
                                                </td>
                                                <td className="py-2 px-3 text-right font-semibold text-gray-900 tabular-nums">

                                                </td>
                                                <td className="py-2 px-3 text-right font-semibold text-gray-900 tabular-nums">
                                                    {formatCurrency(group.final_balance)}
                                                </td>
                                            </tr>
                                        )}

                                        {/* Spacing row for cleaner look between groups */}
                                        <tr className="h-4"></tr>
                                    </React.Fragment>
                                );
                            })
                        )}

                        {/* Grand Total Footer Row */}
                        {processedData.length > 0 && (
                            <tr className="border-t-2 border-gray-300">
                                <td colSpan="5" className="py-3 px-3 font-bold text-gray-900 text-lg uppercase">
                                    Total
                                </td>
                                <td className="py-3 px-3 text-right font-bold text-gray-900 text-lg tabular-nums">
                                    {formatCurrency(grandTotal)}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </ReportLayout>
    );
}
