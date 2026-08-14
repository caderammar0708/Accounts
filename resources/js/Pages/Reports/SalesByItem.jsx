import React, { useState, useMemo } from 'react';
import ReportLayout from '@/Layouts/ReportLayout';
import { Head, Link, router } from '@inertiajs/react';
import CommonButton from '@/Components/CommonButton';
import ReportDateFilter from '@/Components/ReportDateFilter';
import { useDateFormat, formatDate } from '@/Utils/dateFormat';
import { getEditRoute } from '@/Utils/routeUtils';

export default function SalesByItem({ reportData, filters, auth }) {
    const dateFormat = useDateFormat();
    const [collapsedGroups, setCollapsedGroups] = useState(new Set());

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
        router.get(route('reports.sales-by-item'), {
            start_date: newFilters.start_date,
            end_date: newFilters.end_date,
            type: newFilters.type,
            display_by: filters.display_by
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const displayBy = filters.display_by || 'total';
    const isMonthWise = displayBy === 'month';
    const monthCols = filters.months || [];

    const toggleDisplayBy = () => {
        const newDisplayBy = displayBy === 'month' ? 'total' : 'month';
        router.get(route('reports.sales-by-item'), {
            ...filters,
            display_by: newDisplayBy,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const items = reportData || [];
    const totalAmount = items.reduce((sum, group) => sum + parseFloat(group.item.total_amount || 0), 0);
    const totalQuantity = items.reduce((sum, group) => sum + parseFloat(group.item.total_qty || 0), 0);

    const homeCurrency = auth.company?.home_currency_prefix || auth.company?.home_currency || '';

    const Currency = ({ value }) => (
        <span className={value < 0 ? 'text-red-600' : 'text-slate-900'}>
            <span className="text-[10px] font-bold text-slate-400 mr-1">{homeCurrency}</span>
            {parseFloat(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
    );

    const formatQty = (val) => {
        if (val < 0) return <span className="text-red-600">-{Math.abs(val).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>;
        return <span>{Number(val).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>;
    };

    const handleExportExcel = () => {
        const companyName = auth.company?.company_name || 'Company';
        let csvContent = `"${companyName}"\n"Sales By Item Report"\n`;
        csvContent += `"Date Range: ${filters.start_date} to ${filters.end_date}"\n\n`;
        
        if (isMonthWise) {
            csvContent += `"Item Name",`;
            monthCols.forEach(m => {
                csvContent += `"${m} Qty","${m} Amount",`;
            });
            csvContent += `"Total Qty","Total Amount"\n`;

            items.forEach(group => {
                csvContent += `"${group.item.name}",`;
                monthCols.forEach(m => {
                    const mData = group.item.monthly_totals?.[m] || { qty: 0, amount: 0 };
                    csvContent += `${mData.qty},${mData.amount},`;
                });
                csvContent += `${group.item.total_qty},${group.item.total_amount}\n`;
            });
        } else {
            csvContent += `"Date","Transaction Type","Number","Customer","Item Name","Quantity Sold","Rate","Total Amount (${homeCurrency})"\n`;
            items.forEach(group => {
                group.lines.forEach(line => {
                    csvContent += `"${line.date}","${line.transaction_type}","${line.reference}","${line.contact_name}","${group.item.name}",${line.qty},${line.rate},${line.amount}\n`;
                });
                csvContent += `"","","","","Total for ${group.item.name}",${group.item.total_qty},"","${group.item.total_amount}"\n\n`;
            });
            csvContent += `"","","","","Grand Total",${totalQuantity},"","${totalAmount}"\n`;
        }

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Sales_By_Item.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filterElements = (
        <div className="flex flex-row flex-wrap items-end gap-3">
            <ReportDateFilter
                currentFilter={{ start_date: filters.start_date, end_date: filters.end_date, type: filters.type }}
                onFilterChange={handleFilterChange}
            />
            <CommonButton
                onClick={toggleDisplayBy}
                variant="secondary"
                className="h-[30px] !px-3 mb-[1px]"
            >
                <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                {displayBy === 'month' ? 'View Totals' : 'View by Month'}
            </CommonButton>
        </div>
    );

    return (
        <ReportLayout
            title="Sales By Item"
            filters={filterElements}
            onExportExcel={handleExportExcel}
        >
            <Head title="Sales By Item" />

            <div className="text-center mb-8 font-serif">
                <h2 className="text-xl font-bold text-gray-900">Sales By Item</h2>
                <h3 className="text-sm text-gray-700 mt-1">{auth.company?.company_name}</h3>
                <p className="text-[13px] text-gray-500 mt-1">
                    {filters.start_date ? formatDate(filters.start_date, dateFormat) : 'Beginning'} - {formatDate(filters.end_date, dateFormat)}
                </p>
            </div>

            <div className="w-full overflow-x-auto pb-10">
                <table className="w-full text-[13px] text-left border-collapse table-fixed min-w-max">
                    <thead>
                        <tr className="border-y-2 border-gray-300">
                            {isMonthWise ? (
                                <>
                                    <th className="py-2.5 px-3 font-semibold text-gray-900 w-64">Item Name</th>
                                    {monthCols.map(m => {
                                        const d = new Date(m + '-01');
                                        return (
                                            <th key={m} className="py-2.5 px-3 font-semibold text-gray-900 text-right whitespace-nowrap min-w-[100px]">
                                                {d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                            </th>
                                        );
                                    })}
                                    <th className="py-2.5 px-3 font-semibold text-gray-900 text-right w-32 border-l border-gray-100">Total</th>
                                </>
                            ) : (
                                <>
                                    <th className="py-2.5 px-3 font-semibold text-gray-900 w-[12%]">Date</th>
                                    <th className="py-2.5 px-3 font-semibold text-gray-900 w-[15%]">Transaction Type</th>
                                    <th className="py-2.5 px-3 font-semibold text-gray-900 w-[10%]">Number</th>
                                    <th className="py-2.5 px-3 font-semibold text-gray-900 w-[23%]">Customer</th>
                                    <th className="py-2.5 px-3 font-semibold text-gray-900 text-right w-[10%]">Qty</th>
                                    <th className="py-2.5 px-3 font-semibold text-gray-900 text-right w-[15%]">Rate</th>
                                    <th className="py-2.5 px-3 font-semibold text-gray-900 text-right w-[15%]">Amount</th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={isMonthWise ? monthCols.length + 2 : 7} className="py-8 text-center text-gray-500">
                                    No records found for this period.
                                </td>
                            </tr>
                        ) : (
                            items.map((group) => {
                                const displayName = group.item.name;
                                const isCollapsed = collapsedGroups.has(group.item.id);

                                if (isMonthWise) {
                                    return (
                                        <tr key={group.item.id} className="bg-white hover:bg-slate-50 transition-colors border-b border-slate-100">
                                            <td className="py-3 px-3 font-semibold text-gray-800">
                                                <div className="flex flex-col">
                                                    <span>{displayName}</span>
                                                    {group.item.sku && <span className="text-gray-500 font-normal text-xs">SKU: {group.item.sku}</span>}
                                                </div>
                                            </td>
                                            {monthCols.map(m => {
                                                const mData = group.item.monthly_totals?.[m] || { qty: 0, amount: 0 };
                                                return (
                                                    <td key={m} className="py-3 px-3 text-right">
                                                        <div className="font-medium text-gray-900 tabular-nums"><Currency value={mData.amount} /></div>
                                                        {mData.qty !== 0 && <div className="text-[11px] text-gray-500 mt-0.5">{formatQty(mData.qty)} qty</div>}
                                                    </td>
                                                );
                                            })}
                                            <td className="py-3 px-3 text-right border-l border-gray-100">
                                                <div className="font-bold text-gray-900 tabular-nums"><Currency value={group.item.total_amount} /></div>
                                                <div className="text-[11px] text-gray-500 mt-0.5">{formatQty(group.item.total_qty)} qty</div>
                                            </td>
                                        </tr>
                                    );
                                }

                                return (
                                    <React.Fragment key={group.item.id}>
                                        <tr
                                            className="bg-slate-50/50 hover:bg-slate-100 cursor-pointer transition-colors"
                                            onClick={() => toggleGroup(group.item.id)}
                                        >
                                            <td colSpan="4" className="py-2 px-3 font-bold text-gray-800">
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
                                            <td className="py-2 px-3 text-right font-semibold text-gray-900 tabular-nums">
                                                {formatQty(group.item.total_qty)}
                                            </td>
                                            <td className="py-2 px-3"></td>
                                            <td className="py-2 px-3 text-right font-semibold text-gray-900 tabular-nums">
                                                <Currency value={group.item.total_amount} />
                                            </td>
                                        </tr>

                                        {!isCollapsed && group.lines.map((tx) => (
                                            <tr key={`${tx.transaction_type}-${tx.id}`} className="hover:bg-slate-50 transition-colors bg-white">
                                                <td className="py-2 px-3 text-gray-600 pl-10">
                                                    {tx.date}
                                                </td>
                                                <td className="py-2 px-3 text-gray-600 capitalize truncate">
                                                    {tx.transaction_type}
                                                </td>
                                                <td className="py-2 px-3 text-gray-600">
                                                    {tx.reference || '-'}
                                                </td>
                                                <td className="py-2 px-3 text-gray-600 truncate" title={tx.contact_name}>
                                                    {tx.contact_name || '-'}
                                                </td>
                                                <td className="py-2 px-3 text-right tabular-nums text-gray-900">
                                                    {formatQty(tx.qty)}
                                                </td>
                                                <td className="py-2 px-3 text-right tabular-nums text-gray-600">
                                                    {tx.rate ? <Currency value={tx.rate} /> : '-'}
                                                </td>
                                                <td className="py-2 px-3 text-right tabular-nums font-medium text-gray-900">
                                                    <Link href={route(getEditRoute(tx.transaction_type), tx.journal_entry_id)} className="text-indigo-600 hover:text-indigo-900 hover:underline">
                                                        <Currency value={tx.amount} />
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}

                                        {!isCollapsed && group.lines.length > 0 && (
                                            <tr className="border-t border-gray-100 bg-white">
                                                <td colSpan="4" className="py-2 px-3 font-semibold text-gray-700 pl-10 text-right">
                                                    Total for {displayName}
                                                </td>
                                                <td className="py-2 px-3 text-right font-semibold text-gray-900 tabular-nums">
                                                    {formatQty(group.item.total_qty)}
                                                </td>
                                                <td className="py-2 px-3"></td>
                                                <td className="py-2 px-3 text-right font-semibold text-gray-900 tabular-nums">
                                                    <Currency value={group.item.total_amount} />
                                                </td>
                                            </tr>
                                        )}

                                        <tr className="h-4"></tr>
                                    </React.Fragment>
                                );
                            })
                        )}

                        {items.length > 0 && isMonthWise && (
                            <tr className="border-t-2 border-gray-300">
                                <td className="py-3 px-3 font-bold text-gray-900 text-sm uppercase text-right">
                                    Grand Total
                                </td>
                                {monthCols.map(m => {
                                    const mTotalAmt = items.reduce((sum, g) => sum + (g.item.monthly_totals?.[m]?.amount || 0), 0);
                                    const mTotalQty = items.reduce((sum, g) => sum + (g.item.monthly_totals?.[m]?.qty || 0), 0);
                                    return (
                                        <td key={m} className="py-3 px-3 text-right tabular-nums">
                                            <div className="font-bold text-gray-900 text-md"><Currency value={mTotalAmt} /></div>
                                            <div className="text-[11px] text-gray-500 mt-0.5">{formatQty(mTotalQty)} qty</div>
                                        </td>
                                    );
                                })}
                                <td className="py-3 px-3 text-right tabular-nums border-l border-gray-200">
                                    <div className="font-bold text-gray-900 text-lg"><Currency value={totalAmount} /></div>
                                </td>
                            </tr>
                        )}
                        {items.length > 0 && !isMonthWise && (
                            <tr className="border-t-2 border-gray-300">
                                <td colSpan="4" className="py-3 px-3 font-bold text-gray-900 text-lg uppercase text-right">
                                    Grand Total
                                </td>
                                <td className="py-3 px-3 text-right font-bold text-gray-900 text-lg tabular-nums">
                                    {formatQty(totalQuantity)}
                                </td>
                                <td className="py-3 px-3"></td>
                                <td className="py-3 px-3 text-right font-bold text-gray-900 text-lg tabular-nums">
                                    <Currency value={totalAmount} />
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </ReportLayout>
    );
}
