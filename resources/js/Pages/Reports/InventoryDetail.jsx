import React, { useState } from 'react';
import { getEditRoute } from '@/Utils/routeUtils';
import ReportLayout from '@/Layouts/ReportLayout';
import { Head, router, Link } from '@inertiajs/react';
import CommonInput from '@/Components/CommonInput';
import { useDateFormat, formatDate } from '@/Utils/dateFormat';
import ReportDateFilter from '@/Components/ReportDateFilter';

export default function InventoryDetail({ item, lines, filters, auth }) {
    const dateFormat = useDateFormat();
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

    let runningQty = parseFloat(item.opening_qty || 0);
    const linesWithTotal = lines.map(line => {
        runningQty += parseFloat(line.qty_change || 0);
        return {
            ...line,
            running_qty: runningQty
        };
    });

    const sortedLines = [...linesWithTotal].sort((a, b) => {
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
        } else if (sortField === 'qty_change') {
            comparison = parseFloat(a.qty_change || 0) - parseFloat(b.qty_change || 0);
        } else if (sortField === 'running_qty') {
            comparison = parseFloat(a.running_qty || 0) - parseFloat(b.running_qty || 0);
        }

        return sortDirection === 'desc' ? -comparison : comparison;
    });

    const handleFilterChange = (newFilters) => {
        router.get(route('reports.inventory-detail', item.id), {
            start_date: newFilters.start_date,
            end_date: newFilters.end_date,
            type: newFilters.type
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleExportExcel = () => {
        const companyName = auth.company?.company_name || 'Company';

        let csvContent = "";
        csvContent += `"${companyName}"\n`;
        csvContent += `"Inventory Detail: ${item.name}"\n`;
        csvContent += `"Date Range: ${filters.start_date ? formatDate(filters.start_date, dateFormat) : 'All Time'} to ${filters.end_date ? formatDate(filters.end_date, dateFormat) : 'Present'}"\n\n`;

        // Headers
        csvContent += `"Date","Transaction Type","Ref #","Memo","Qty Change","Total Qty"\n`;

        sortedLines.forEach(line => {
            csvContent += `"${formatDate(line.date, dateFormat)}","${line.transaction_type}","${line.reference || ''}","${line.memo || ''}",${line.qty_change},${line.running_qty}\n`;
        });

        // Create download blob
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${companyName.replace(/[^a-z0-9]/gi, '_')}_Inventory_Detail_${item.name}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filterElements = (
        <div className="flex items-end gap-4 flex-wrap">
            <ReportDateFilter
                currentFilter={{ start_date: filters.start_date, end_date: filters.end_date, type: filters.type }}
                onFilterChange={handleFilterChange}
            />
        </div>
    );

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
            title={`Inventory Detail - ${item.name}`}
            filters={filterElements}
            onExportExcel={handleExportExcel}
        >
            <Head title={`Inventory Detail - ${item.name}`} />

            <div className="text-center mb-8 font-serif">
                <h2 className="text-xl font-bold text-gray-900">Inventory Transaction Detail</h2>
                <h3 className="text-sm text-gray-700 mt-1">{auth.company?.company_name}</h3>
                <h4 className="text-md font-semibold text-primary mt-2">{item.name} {item.sku ? `(SKU: ${item.sku})` : ''}</h4>
                {filters.type === 'all_dates' ? (
                    <p className="text-[13px] text-gray-500 mt-1">All Dates</p>
                ) : (
                    <p className="text-[13px] text-gray-500 mt-1">
                        {filters.start_date ? formatDate(filters.start_date, dateFormat) : 'All Time'}
                        {' '}to{' '}
                        {filters.end_date ? formatDate(filters.end_date, dateFormat) : 'Present'}
                    </p>
                )}
            </div>

            <div className="w-full overflow-x-auto pb-10">
                <table className="w-full text-[13px] text-left border-collapse">
                    <thead>
                        <tr className="border-y-2 border-gray-300">
                            <SortableHeader field="date" label="Date" />
                            <SortableHeader field="transaction_type" label="Transaction Type" />
                            <SortableHeader field="reference" label="Ref #" />
                            <SortableHeader field="memo" label="Memo / Description" className="w-1/3" />
                            <SortableHeader field="qty_change" label="Qty Change" align="right" />
                            <SortableHeader field="running_qty" label="Total Qty" align="right" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {linesWithTotal.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="py-8 text-center text-gray-500">No inventory transactions found for this period.</td>
                            </tr>
                        ) : (
                            linesWithTotal.map((line) => (
                                <tr 
                                    key={line.id} 
                                    className="hover:bg-gray-50 transition-colors group cursor-pointer"
                                    onClick={() => line.journal_entry_id && router.get(route(getEditRoute(line.transaction_type), line.journal_entry_id))}
                                >
                                    <td className="py-2 px-3 text-gray-600 whitespace-nowrap">
                                        {formatDate(line.date, dateFormat)}
                                    </td>
                                    <td className="py-2 px-3 text-gray-900 capitalize group-hover:text-primary transition-colors">
                                        {line.transaction_type.replace('_', ' ')}
                                    </td>
                                    <td className="py-2 px-3 text-gray-600">
                                        {line.reference || '-'}
                                    </td>
                                    <td className="py-2 px-3 text-gray-600">
                                        {line.memo || '-'}
                                    </td>
                                    <td className="py-2 px-3 text-right tabular-nums font-medium">
                                        <span className={line.qty_change < 0 ? 'text-red-600' : 'text-gray-900'}>
                                            {parseFloat(line.qty_change || 0).toLocaleString('en-US', { maximumFractionDigits: 4 })}
                                        </span>
                                    </td>
                                    <td className="py-2 px-3 text-right tabular-nums font-medium">
                                        <span className={line.running_qty < 0 ? 'text-red-600' : 'text-gray-900'}>
                                            {parseFloat(line.running_qty || 0).toLocaleString('en-US', { maximumFractionDigits: 4 })}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-20 text-[10px] text-slate-400 font-bold text-center uppercase tracking-widest italic">
                Generated on {formatDate(new Date(), dateFormat)}
            </div>
        </ReportLayout>
    );
}
