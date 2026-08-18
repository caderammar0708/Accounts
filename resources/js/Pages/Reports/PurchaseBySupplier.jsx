import React, { useState } from 'react';
import ReportLayout from '@/Layouts/ReportLayout';
import { Head, router } from '@inertiajs/react';
import CommonButton from '@/Components/CommonButton';
import ReportDateFilter from '@/Components/ReportDateFilter';
import { useDateFormat, formatDate } from '@/Utils/dateFormat';
import { getTransactionUrl } from '@/Utils/routeUtils';
import ReportCurrency from '@/Components/ReportCurrency';
import Modal from '@/Components/Modal';

export default function PurchaseBySupplier({ reportData, filters, auth }) {
    const dateFormat = useDateFormat();
    const [drillDown, setDrillDown] = useState(null);

    const handleFilterChange = (newFilters) => {
        router.get(route('reports.purchases-by-supplier'), { 
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
        router.get(route('reports.purchases-by-supplier'), {
            ...filters,
            display_by: newDisplayBy,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const suppliers = reportData || [];
    const totalAmount = suppliers.reduce((sum, item) => sum + parseFloat(item.total_amount || 0), 0);
    const totalCount = suppliers.reduce((sum, item) => sum + parseFloat(item.tx_count || 0), 0);

    const homeCurrency = auth.company?.home_currency_prefix || auth.company?.home_currency || '';

    const Currency = ({ value, className = '' }) => (
        <ReportCurrency value={value} currency={homeCurrency} className={className} />
    );

    const handleMonthCellClick = (supplier, monthKey, mData) => {
        const txLines = mData?.lines || [];
        if (txLines.length === 0) return;
        if (txLines.length === 1) {
            const url = getTransactionUrl(txLines[0]);
            if (url && url !== '#') {
                router.visit(url);
            }
        } else {
            const monthLabel = monthKey ? new Date(monthKey + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
            setDrillDown({
                title: `${supplier.supplier_name} (${monthLabel})`,
                lines: txLines
            });
        }
    };

    const handleTotalCellClick = (supplier) => {
        const txLines = supplier.lines || [];
        if (txLines.length === 0) return;
        if (txLines.length === 1) {
            const url = getTransactionUrl(txLines[0]);
            if (url && url !== '#') {
                router.visit(url);
            }
        } else {
            setDrillDown({
                title: `${supplier.supplier_name} (All Transactions)`,
                lines: txLines
            });
        }
    };

    const handleExportExcel = () => {
        const companyName = auth.company?.company_name || 'Company';
        let csvContent = `"${companyName}"\n"Purchase By Supplier Report"\n`;
        csvContent += `"Date Range: ${filters.start_date} to ${filters.end_date}"\n\n`;
        
        if (isMonthWise) {
            csvContent += `"Supplier Name",`;
            monthCols.forEach(m => {
                csvContent += `"${m} Amount",`;
            });
            csvContent += `"Total Amount"\n`;

            suppliers.forEach(item => {
                csvContent += `"${item.supplier_name}",`;
                monthCols.forEach(m => {
                    const mData = item.monthly_totals?.[m] || { amount: 0 };
                    csvContent += `${mData.amount},`;
                });
                csvContent += `${item.total_amount}\n`;
            });
            csvContent += `\n"Total",`;
            monthCols.forEach(m => {
                const mTotalAmt = suppliers.reduce((sum, item) => sum + (item.monthly_totals?.[m]?.amount || 0), 0);
                csvContent += `${mTotalAmt},`;
            });
            csvContent += `${totalAmount}\n`;
        } else {
            csvContent += `"Supplier Name","Transaction Count","Total Amount (${homeCurrency})"\n`;
            suppliers.forEach(item => {
                csvContent += `"${item.supplier_name}",${item.tx_count},${item.total_amount}\n`;
            });
            csvContent += `\n"Total",${totalCount},${totalAmount}\n`;
        }

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Purchase_By_Supplier.csv`);
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
            title="Purchase By Supplier"
            filters={filterElements}
            onExportExcel={handleExportExcel}
        >
            <Head title="Purchase By Supplier" />

            <div className="text-center mb-8 font-serif">
                <h2 className="text-xl font-bold text-gray-900">Purchase By Supplier</h2>
                <h3 className="text-sm text-gray-700 mt-1">{auth.company?.company_name}</h3>
                <p className="text-[13px] text-gray-500 mt-1">
                    {filters.start_date ? formatDate(filters.start_date, dateFormat) : 'Beginning'} - {formatDate(filters.end_date, dateFormat)}
                </p>
            </div>

            <div className="w-full overflow-x-auto pb-10">
                <table className="min-w-full text-[13px] text-left border-collapse">
                    <thead>
                        <tr className="border-y-2 border-gray-300">
                            <th className="py-2.5 px-3 font-semibold text-gray-900 min-w-[200px]">Supplier Name</th>
                            {isMonthWise ? (
                                <>
                                    {monthCols.map(m => {
                                        const d = new Date(m + '-01');
                                        return (
                                            <th key={m} className="py-2.5 px-3 font-semibold text-gray-900 text-right whitespace-nowrap min-w-[120px]">
                                                {d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                            </th>
                                        );
                                    })}
                                    <th className="py-2.5 px-3 font-semibold text-gray-900 text-right whitespace-nowrap min-w-[130px] border-l border-gray-100">Total</th>
                                </>
                            ) : (
                                <>
                                    <th className="py-2.5 px-3 font-semibold text-gray-900 text-right whitespace-nowrap min-w-[110px]">Transaction Count</th>
                                    <th className="py-2.5 px-3 font-semibold text-gray-900 text-right whitespace-nowrap min-w-[130px]">Amount</th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {suppliers.length === 0 ? (
                            <tr>
                                <td colSpan={isMonthWise ? monthCols.length + 2 : 3} className="py-8 text-center text-gray-500">No purchases found for this period.</td>
                            </tr>
                        ) : (
                            suppliers.map((item, index) => (
                                <tr key={index} className="hover:bg-gray-50 transition-colors group">
                                    <td className="py-2 px-3 text-gray-900 font-medium">
                                        <button
                                            type="button"
                                            onClick={() => handleTotalCellClick(item)}
                                            className="text-left font-medium text-gray-900 hover:text-indigo-600 hover:underline transition-colors"
                                        >
                                            {item.supplier_name}
                                        </button>
                                    </td>
                                    {isMonthWise ? (
                                        <>
                                            {monthCols.map(m => {
                                                const mData = item.monthly_totals?.[m] || { amount: 0, tx_count: 0, lines: [] };
                                                const hasLines = mData.lines && mData.lines.length > 0;
                                                return (
                                                    <td
                                                        key={m}
                                                        className={`py-2 px-3 text-right whitespace-nowrap ${hasLines ? 'cursor-pointer hover:bg-indigo-50/50 group/cell' : ''}`}
                                                        onClick={() => handleMonthCellClick(item, m, mData)}
                                                    >
                                                        <span className={hasLines ? 'text-indigo-600 group-hover/cell:text-indigo-900 group-hover/cell:underline font-semibold' : 'text-gray-900'}>
                                                            <Currency value={mData.amount} />
                                                        </span>
                                                    </td>
                                                );
                                            })}
                                            <td
                                                className={`py-2 px-3 text-right whitespace-nowrap font-bold border-l border-gray-100 ${item.lines?.length > 0 ? 'cursor-pointer hover:bg-indigo-50/50 group/cell' : ''}`}
                                                onClick={() => handleTotalCellClick(item)}
                                            >
                                                <span className={item.lines?.length > 0 ? 'text-indigo-600 group-hover/cell:text-indigo-900 group-hover/cell:underline' : 'text-gray-900'}>
                                                    <Currency value={item.total_amount} />
                                                </span>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td
                                                className={`py-2 px-3 text-right whitespace-nowrap ${item.lines?.length > 0 ? 'cursor-pointer hover:bg-indigo-50/50' : ''}`}
                                                onClick={() => handleTotalCellClick(item)}
                                            >
                                                <span className={item.lines?.length > 0 ? 'text-indigo-600 hover:underline' : 'text-gray-900'}>
                                                    {parseFloat(item.tx_count).toLocaleString()}
                                                </span>
                                            </td>
                                            <td
                                                className={`py-2 px-3 text-right whitespace-nowrap font-semibold ${item.lines?.length > 0 ? 'cursor-pointer hover:bg-indigo-50/50' : ''}`}
                                                onClick={() => handleTotalCellClick(item)}
                                            >
                                                <span className={item.lines?.length > 0 ? 'text-indigo-600 hover:underline' : 'text-gray-900'}>
                                                    <Currency value={item.total_amount} />
                                                </span>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))
                        )}
                        {isMonthWise ? (
                            <tr className="border-t-2 border-b-2 border-gray-400 font-bold bg-white">
                                <td className="py-3 px-3 text-gray-900 uppercase">TOTAL</td>
                                {monthCols.map(m => {
                                    const mTotalAmt = suppliers.reduce((sum, item) => sum + (item.monthly_totals?.[m]?.amount || 0), 0);
                                    return (
                                        <td key={m} className="py-3 px-3 text-right whitespace-nowrap text-gray-900">
                                            <Currency value={mTotalAmt} />
                                        </td>
                                    );
                                })}
                                <td className="py-3 px-3 text-right whitespace-nowrap text-gray-900 border-l border-gray-200">
                                    <Currency value={totalAmount} />
                                </td>
                            </tr>
                        ) : (
                            <tr className="border-t-2 border-b-2 border-gray-400 font-bold bg-white">
                                <td className="py-3 px-3 text-gray-900 uppercase">TOTAL</td>
                                <td className="py-3 px-3 text-right whitespace-nowrap text-gray-900">{parseFloat(totalCount).toLocaleString()}</td>
                                <td className="py-3 px-3 text-right whitespace-nowrap text-gray-900">
                                    <Currency value={totalAmount} />
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Drill-down Modal for multi-transaction cells */}
            <Modal show={!!drillDown} onClose={() => setDrillDown(null)} maxWidth="3xl">
                <div className="p-6">
                    <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                        <div>
                            <h3 className="text-base font-bold text-gray-900">
                                {drillDown?.title}
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {drillDown?.lines?.length} transaction{drillDown?.lines?.length === 1 ? '' : 's'} — click any row to open the transaction
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setDrillDown(null)}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="mt-4 max-h-[60vh] overflow-y-auto">
                        <table className="min-w-full text-[13px] text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200 text-gray-500 text-xs uppercase bg-gray-50">
                                    <th className="py-2.5 px-3 font-semibold">Date</th>
                                    <th className="py-2.5 px-3 font-semibold">Type</th>
                                    <th className="py-2.5 px-3 font-semibold">Number</th>
                                    <th className="py-2.5 px-3 font-semibold">Supplier</th>
                                    <th className="py-2.5 px-3 font-semibold text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {drillDown?.lines?.map((tx) => {
                                    const url = getTransactionUrl(tx);
                                    return (
                                        <tr
                                            key={`${tx.transaction_type}-${tx.id}`}
                                            className="hover:bg-indigo-50/60 transition-colors cursor-pointer group"
                                            onClick={() => url && url !== '#' && router.visit(url)}
                                        >
                                            <td className="py-2.5 px-3 text-gray-600 whitespace-nowrap">
                                                {tx.date}
                                            </td>
                                            <td className="py-2.5 px-3 text-gray-600 capitalize truncate group-hover:text-primary transition-colors">
                                                {tx.transaction_type?.replace('_', ' ')}
                                            </td>
                                            <td className="py-2.5 px-3 text-gray-600 whitespace-nowrap font-mono">
                                                {tx.reference || '-'}
                                            </td>
                                            <td className="py-2.5 px-3 text-gray-600 truncate max-w-[150px]" title={tx.contact_name}>
                                                {tx.contact_name || '-'}
                                            </td>
                                            <td className="py-2.5 px-3 text-right whitespace-nowrap font-medium text-indigo-600 group-hover:underline">
                                                <Currency value={tx.amount} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                        <CommonButton variant="secondary" onClick={() => setDrillDown(null)}>
                            Close
                        </CommonButton>
                    </div>
                </div>
            </Modal>
        </ReportLayout>
    );
}
