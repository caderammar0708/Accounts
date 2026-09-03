import React, { useState } from 'react';
import ReportLayout from '@/Layouts/ReportLayout';
import { Head, router } from '@inertiajs/react';
import CommonButton from '@/Components/CommonButton';
import ReportDateFilter from '@/Components/ReportDateFilter';
import { useDateFormat, formatDate } from '@/Utils/dateFormat';
import { getTransactionUrl } from '@/Utils/routeUtils';
import ReportCurrency from '@/Components/ReportCurrency';

export default function PurchaseByItemDetail({ reportData, filters, auth }) {
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
        router.get(route('reports.purchase-by-item-detail'), {
            start_date: newFilters.start_date,
            end_date: newFilters.end_date,
            type: newFilters.type,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const items = reportData || [];
    const totalAmount = items.reduce((sum, group) => sum + parseFloat(group.item.total_amount || 0), 0);
    const totalQuantity = items.reduce((sum, group) => sum + parseFloat(group.item.total_qty || 0), 0);

    const homeCurrency = auth.company?.home_currency_prefix || auth.company?.home_currency || '';

    const Currency = ({ value, className = '' }) => (
        <ReportCurrency value={value} currency={homeCurrency} className={className} />
    );

    const formatQty = (val) => {
        if (val < 0) return <span className="text-red-600">-{Math.abs(val).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>;
        return <span>{Number(val).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>;
    };

    const handleExportExcel = () => {
        const companyName = auth.company?.company_name || 'Company';
        let csvContent = `"${companyName}"\n"Purchase By Item Detail"\n`;
        csvContent += `"Date Range: ${filters.start_date} to ${filters.end_date}"\n\n`;

        csvContent += `"Date","Transaction Type","Number","Supplier","Item Name","Quantity Purchased","Rate","Total Amount (${homeCurrency})"\n`;
        items.forEach(group => {
            group.lines.forEach(line => {
                csvContent += `"${line.date}","${line.transaction_type}","${line.reference}","${line.contact_name}","${group.item.name}",${line.qty},${line.rate},${line.amount}\n`;
            });
            csvContent += `"","","","","Total for ${group.item.name}",${group.item.total_qty},"","${group.item.total_amount}"\n\n`;
        });
        csvContent += `"","","","","Grand Total",${totalQuantity},"","${totalAmount}"\n`;

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Purchase_By_Item_Detail.csv`);
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
        </div>
    );

    return (
        <ReportLayout
            title="Purchase By Item Detail"
            filters={filterElements}
            onExportExcel={handleExportExcel}
        >
            <Head title="Purchase By Item Detail" />

            <div className="text-center mb-8 font-serif">
                <h2 className="text-xl font-bold text-gray-900">Purchase By Item Detail</h2>
                <h3 className="text-sm text-gray-700 mt-1">{auth.company?.company_name}</h3>
                <p className="text-[13px] text-gray-500 mt-1">
                    {filters.start_date ? formatDate(filters.start_date, dateFormat) : 'Beginning'} - {formatDate(filters.end_date, dateFormat)}
                </p>
            </div>

            <div className="w-full overflow-x-auto pb-10">
                <table className="min-w-full text-[13px] text-left border-collapse">
                    <thead>
                        <tr className="border-y-2 border-gray-300">
                            <th className="py-2.5 px-3 font-semibold text-gray-900 whitespace-nowrap min-w-[100px]">Date</th>
                            <th className="py-2.5 px-3 font-semibold text-gray-900 whitespace-nowrap min-w-[130px]">Transaction Type</th>
                            <th className="py-2.5 px-3 font-semibold text-gray-900 whitespace-nowrap min-w-[100px]">Number</th>
                            <th className="py-2.5 px-3 font-semibold text-gray-900 min-w-[180px]">Supplier</th>
                            <th className="py-2.5 px-3 font-semibold text-gray-900 text-right whitespace-nowrap min-w-[80px]">Qty</th>
                            <th className="py-2.5 px-3 font-semibold text-gray-900 text-right whitespace-nowrap min-w-[110px]">Rate</th>
                            <th className="py-2.5 px-3 font-semibold text-gray-900 text-right whitespace-nowrap min-w-[120px]">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="py-8 text-center text-gray-500">
                                    No records found for this period.
                                </td>
                            </tr>
                        ) : (
                            items.map((group) => {
                                const displayName = group.item.name;
                                const isCollapsed = collapsedGroups.has(group.item.id);

                                return (
                                    <React.Fragment key={group.item.id}>
                                        <tr
                                            className="bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer border-t border-slate-200"
                                            onClick={() => toggleGroup(group.item.id)}
                                        >
                                            <td colSpan={7} className="py-2 px-3 font-semibold text-gray-800">
                                                <div className="flex items-center gap-2">
                                                    <svg
                                                        className={`w-4 h-4 text-gray-500 transition-transform ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}
                                                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                    <span className="text-[14px]">{displayName}</span>
                                                    {group.item.sku && <span className="text-xs font-normal text-gray-500">({group.item.sku})</span>}
                                                </div>
                                            </td>
                                        </tr>

                                        {!isCollapsed && group.lines.map((line, idx) => {
                                            const url = getTransactionUrl(line);
                                            return (
                                                <tr
                                                    key={`${line.id}-${idx}`}
                                                    className="bg-white hover:bg-slate-50 transition-colors border-b border-slate-50"
                                                    onClick={() => url && url !== '#' && router.visit(url)}
                                                    style={{ cursor: url && url !== '#' ? 'pointer' : 'default' }}
                                                >
                                                    <td className="py-2 px-3 pl-8 text-gray-600">
                                                        {formatDate(line.date, dateFormat)}
                                                    </td>
                                                    <td className="py-2 px-3 text-gray-700 capitalize">
                                                        {line.transaction_type}
                                                    </td>
                                                    <td className="py-2 px-3 text-gray-700 font-medium">
                                                        {url && url !== '#' ? (
                                                            <span className="text-primary-600 hover:text-primary-800 hover:underline">{line.reference}</span>
                                                        ) : (
                                                            line.reference
                                                        )}
                                                    </td>
                                                    <td className="py-2 px-3 text-gray-700">
                                                        {line.contact_name}
                                                    </td>
                                                    <td className="py-2 px-3 text-right text-gray-700">
                                                        {formatQty(line.qty)}
                                                    </td>
                                                    <td className="py-2 px-3 text-right text-gray-700">
                                                        <Currency value={line.rate} />
                                                    </td>
                                                    <td className="py-2 px-3 text-right text-gray-900 font-medium">
                                                        <Currency value={line.amount} />
                                                    </td>
                                                </tr>
                                            );
                                        })}

                                        {!isCollapsed && (
                                            <tr className="bg-slate-50/50 border-b-2 border-slate-200">
                                                <td colSpan={4} className="py-2.5 px-3 text-right font-semibold text-gray-800">
                                                    Total for {displayName}
                                                </td>
                                                <td className="py-2.5 px-3 text-right font-semibold text-gray-800">
                                                    {formatQty(group.item.total_qty)}
                                                </td>
                                                <td className="py-2.5 px-3 text-right font-semibold text-gray-800">
                                                </td>
                                                <td className="py-2.5 px-3 text-right font-semibold text-gray-900">
                                                    <Currency value={group.item.total_amount} />
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </tbody>
                    <tfoot>
                        <tr className="bg-slate-100/70 border-y-2 border-gray-300 font-bold">
                            <td colSpan={4} className="py-3 px-3 text-right text-gray-900">Grand Total</td>
                            <td className="py-3 px-3 text-right whitespace-nowrap text-gray-900">{formatQty(totalQuantity)}</td>
                            <td className="py-3 px-3 text-right whitespace-nowrap text-gray-900"></td>
                            <td className="py-3 px-3 text-right whitespace-nowrap text-gray-900"><Currency value={totalAmount} /></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </ReportLayout>
    );
}
