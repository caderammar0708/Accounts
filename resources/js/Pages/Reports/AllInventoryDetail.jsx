import React, { useState, useMemo } from 'react';
import ReportLayout from '@/Layouts/ReportLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useDateFormat, formatDate } from '@/Utils/dateFormat';
import { getEditRoute } from '@/Utils/routeUtils';
import ReportDateFilter from '@/Components/ReportDateFilter';
import ItemMultiSelectFilter from '@/Components/ItemMultiSelectFilter';

export default function AllInventoryDetail({ reportData = [], filters = {}, allInventoryItems = [] }) {
    const { auth } = usePage().props;
    const currencyPrefix = auth.company?.home_currency_prefix || auth.company?.home_currency || '';
    const dateFormat = useDateFormat();

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
        router.get(route('reports.inventory-detail-all'), {
            start_date: newFilters.start_date,
            end_date: newFilters.end_date,
            type: newFilters.type,
            item_ids: filters.item_ids || [],
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleItemsChange = (selectedIds) => {
        router.get(route('reports.inventory-detail-all'), {
            start_date: filters.start_date,
            end_date: filters.end_date,
            type: filters.type,
            item_ids: selectedIds && selectedIds.length > 0 ? selectedIds : undefined,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const filterElements = (
        <div className="flex flex-row flex-wrap items-end gap-3">
            <ReportDateFilter
                currentFilter={{ start_date: filters.start_date, end_date: filters.end_date, type: filters.type }}
                onFilterChange={handleFilterChange}
            />
            <ItemMultiSelectFilter
                items={allInventoryItems || []}
                selectedIds={Array.isArray(filters.item_ids) ? filters.item_ids : []}
                onChange={handleItemsChange}
            />
        </div>
    );

    // Process data to calculate running balances per item and apply sorting
    const processedData = useMemo(() => {
        return reportData.map(group => {
            let currentQty = group.item.opening_qty || 0;
            let currentValue = group.item.opening_value || 0;

            const linesWithBalance = group.lines.map(line => {
                const amount = line.debit - line.credit;
                currentQty += line.qty_change;
                currentValue += amount;

                return {
                    ...line,
                    amount,
                    running_qty: currentQty,
                    running_value: currentValue
                };
            });

            // Sort lines within the item group
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
                } else if (sortField === 'reference') {
                    comparison = (a.reference || '').localeCompare(b.reference || '', undefined, { numeric: true });
                } else if (sortField === 'memo') {
                    comparison = (a.memo || '').localeCompare(b.memo || '');
                } else if (sortField === 'qty') {
                    comparison = (a.qty_change || 0) - (b.qty_change || 0);
                } else if (sortField === 'rate') {
                    comparison = (a.rate || 0) - (b.rate || 0);
                } else if (sortField === 'running_qty') {
                    comparison = (a.running_qty || 0) - (b.running_qty || 0);
                } else if (sortField === 'running_value') {
                    comparison = (a.running_value || 0) - (b.running_value || 0);
                }

                return sortDirection === 'desc' ? -comparison : comparison;
            });

            return {
                ...group,
                lines: sortedLines,
                final_qty: currentQty,
                final_value: currentValue
            };
        });
    }, [reportData, sortField, sortDirection]);

    // Calculate Grand Total
    const grandTotalValue = useMemo(() => {
        return processedData.reduce((sum, group) => sum + group.final_value, 0);
    }, [processedData]);

    const formatCurrency = (val) => {
        const prefix = currencyPrefix ? `${currencyPrefix} ` : '';
        if (val < 0) return <span className="text-red-600">{currencyPrefix ? `${currencyPrefix} -` : '-'}{Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
        return <span>{prefix}{Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
    }; 

    const formatQty = (val) => {
        if (val < 0) return <span className="text-red-600">-{Math.abs(val).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>;
        return <span>{Number(val).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>;
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
            title="Inventory Balance Detail"
            filters={filterElements}
        >
            <Head title="Inventory Balance Detail" />

            <div className="text-center mb-8 font-serif relative">
                <h2 className="text-xl font-bold text-gray-900">{auth.company?.company_name || 'Company'}</h2>
                <h3 className="text-lg text-gray-800 mt-1">Inventory Balance Detail</h3>
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
                            <SortableHeader field="date" label="Date" className="w-[12%]" />
                            <SortableHeader field="transaction_type" label="Transaction Type" className="w-[15%]" />
                            <SortableHeader field="reference" label="Number" className="w-[10%]" />
                            <SortableHeader field="memo" label="Name / Memo" className="w-[18%]" />
                            <SortableHeader field="qty" label="Qty" align="right" className="w-[10%]" />
                            <SortableHeader field="rate" label="Rate / Cost" align="right" className="w-[10%]" />
                            <SortableHeader field="running_qty" label="Qty on Hand" align="right" className="w-[10%]" />
                            <SortableHeader field="running_value" label="Asset Value" align="right" className="w-[15%]" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {processedData.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="py-8 text-center text-gray-500">
                                    No records found for this period.
                                </td>
                            </tr>
                        ) : (
                            processedData.map((group) => {
                                const displayName = group.item.name;
                                const isCollapsed = collapsedGroups.has(group.item.id);
                                return (
                                    <React.Fragment key={group.item.id}>
                                        {/* Group Header Row */}
                                        <tr
                                            className="bg-slate-50/50 hover:bg-slate-100 cursor-pointer transition-colors"
                                            onClick={() => toggleGroup(group.item.id)}
                                        >
                                            <td colSpan="8" className="py-2 px-3 font-bold text-gray-800">
                                                <div className="flex items-center gap-2 whitespace-nowrap">
                                                    <svg
                                                        className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${isCollapsed ? '' : 'rotate-90'}`}
                                                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                                    </svg>
                                                    <span className="truncate">{displayName}</span>
                                                    {group.item.sku && <span className="text-gray-500 font-normal text-xs ml-2">SKU: {group.item.sku}</span>}
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Transaction Lines */}
                                        {!isCollapsed && group.lines.map((tx) => (
                                            <tr key={tx.id} className="hover:bg-slate-50 transition-colors bg-white">
                                                <td className="py-2 px-3 text-gray-600 pl-10">
                                                    {tx.date}
                                                </td>
                                                <td className="py-2 px-3 text-gray-600 capitalize truncate">
                                                    {tx.transaction_type ? tx.transaction_type.replace('_', ' ') : 'Journal Entry'}
                                                </td>
                                                <td className="py-2 px-3 text-gray-600">
                                                    {tx.reference || '-'}
                                                </td>
                                                <td className="py-2 px-3 text-gray-600 truncate" title={tx.memo}>
                                                    {tx.memo || '-'}
                                                </td>
                                                <td className="py-2 px-3 text-right tabular-nums text-gray-900">
                                                    {formatQty(tx.qty_change)}
                                                </td>
                                                <td className="py-2 px-3 text-right tabular-nums text-gray-600">
                                                    {tx.rate ? formatCurrency(tx.rate) : '-'}
                                                </td>
                                                <td className="py-2 px-3 text-right tabular-nums font-medium text-gray-900">
                                                    {formatQty(tx.running_qty)}
                                                </td>
                                                <td className="py-2 px-3 text-right tabular-nums font-medium text-gray-900">
                                                    <Link href={route(getEditRoute(tx.transaction_type), tx.journal_entry_id)} className="text-indigo-600 hover:text-indigo-900 hover:underline">
                                                        {formatCurrency(tx.running_value)}
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}

                                        {/* Group Footer Total (only show if expanded and has lines) */}
                                        {!isCollapsed && group.lines.length > 0 && (
                                            <tr className="border-t border-gray-100 bg-white">
                                                <td colSpan="6" className="py-2 px-3 font-semibold text-gray-700 pl-10 text-right">
                                                    Total for {displayName}
                                                </td>
                                                <td className="py-2 px-3 text-right font-semibold text-gray-900 tabular-nums">
                                                    {formatQty(group.final_qty)}
                                                </td>
                                                <td className="py-2 px-3 text-right font-semibold text-gray-900 tabular-nums">
                                                    {formatCurrency(group.final_value)}
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })
                        )}

                        {/* Grand Total Footer Row */}
                        {processedData.length > 0 && (
                            <tr className="border-t-2 border-gray-300">
                                <td colSpan="7" className="py-3 px-3 font-bold text-gray-900 text-lg uppercase">
                                    Total Asset Value
                                </td>
                                <td className="py-3 px-3 text-right font-bold text-gray-900 text-lg tabular-nums">
                                    {formatCurrency(grandTotalValue)}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </ReportLayout>
    );
}
