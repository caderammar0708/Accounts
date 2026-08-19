import React, { useState } from 'react';
import ReportLayout from '@/Layouts/ReportLayout';
import { Head, router, Link } from '@inertiajs/react';
import CommonButton from '@/Components/CommonButton';
import CommonInput from '@/Components/CommonInput';
import { useDateFormat, formatDate } from '@/Utils/dateFormat';
import ReportDateFilter from '@/Components/ReportDateFilter';
import ReportCurrency from '@/Components/ReportCurrency';

export default function CustomerBalance({ reportData, filters, auth }) {
    const dateFormat = useDateFormat();

    const handleFilterChange = (newFilters) => {
        router.get(route('reports.customer-balance'), { 
            end_date: newFilters.end_date,
            start_date: newFilters.start_date,
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
        router.get(route('reports.customer-balance'), {
            ...filters,
            display_by: newDisplayBy,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const customers = reportData || [];
    const totalBalance = customers.reduce((sum, item) => sum + item.balance, 0);

    const homeCurrency = auth.company?.home_currency_prefix || auth.company?.home_currency || '';

    const Currency = ({ value, className = '' }) => (
        <ReportCurrency value={value} currency={homeCurrency} className={className} />
    );

    const handleExportExcel = () => {
        const companyName = auth.company?.company_name || 'Company';
        let csvContent = `"${companyName}"\n"Customer Balance Summary"\n`;
        csvContent += `"As of ${filters.end_date ? formatDate(filters.end_date, dateFormat) : formatDate(new Date(), dateFormat)}"\n\n`;
        
        if (isMonthWise) {
            csvContent += `"Customer","Email","Phone",`;
            monthCols.forEach(m => {
                csvContent += `"${m} Balance",`;
            });
            csvContent += `"Final Balance"\n`;

            customers.forEach(item => {
                csvContent += `"${item.name}","${item.email || ''}","${item.phone || ''}",`;
                monthCols.forEach(m => {
                    const mData = item.monthly_balances?.[m] || 0;
                    csvContent += `${mData},`;
                });
                csvContent += `${item.balance}\n`;
            });
            csvContent += `\n"Total",,,`;
            monthCols.forEach(m => {
                const mTotalAmt = customers.reduce((sum, item) => sum + (item.monthly_balances?.[m] || 0), 0);
                csvContent += `${mTotalAmt},`;
            });
            csvContent += `${totalBalance}\n`;
        } else {
            csvContent += `"Customer","Email","Phone","Open Balance (${homeCurrency})"\n`;
            customers.forEach(item => {
                csvContent += `"${item.name}","${item.email || ''}","${item.phone || ''}",${item.balance}\n`;
            });
            csvContent += `\n"Total",,,${totalBalance}\n`;
        }

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Customer_Balance_Summary.csv`);
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

    const getDrillDownUrl = (customerId, monthCol = null) => {
        const params = new URLSearchParams();
        if (monthCol) {
            const [y, m] = monthCol.split('-');
            const sDate = `${monthCol}-01`;
            const lastDay = new Date(y, m, 0).getDate();
            const eDate = `${monthCol}-${lastDay.toString().padStart(2, '0')}`;
            params.set('start_date', sDate);
            params.set('end_date', eDate);
            params.set('type', 'custom');
        } else if (filters.type === 'all_dates') {
            params.set('type', 'all_dates');
        } else {
            if (filters.start_date) params.set('start_date', filters.start_date);
            if (filters.end_date) params.set('end_date', filters.end_date);
            if (filters.type) params.set('type', filters.type);
        }
        const qs = params.toString();
        return route('reports.customer-detail', customerId) + (qs ? `?${qs}` : '');
    };

    return (
        <ReportLayout
            title="Customer Balance Summary"
            filters={filterElements}
            onExportExcel={handleExportExcel}
        >
            <Head title="Customer Balance Summary" />

            <div className="text-center mb-8 font-serif">
                <h2 className="text-xl font-bold text-gray-900">Customer Balance Summary</h2>
                <h3 className="text-sm text-gray-700 mt-1">{auth.company?.company_name}</h3>
                {filters.type === 'all_dates' ? (
                    <p className="text-[13px] text-gray-500 mt-1">All Dates</p>
                ) : (
                    <p className="text-[13px] text-gray-500 mt-1">
                        {filters.end_date ? `As of ${formatDate(filters.end_date, dateFormat)}` : `As of ${formatDate(new Date(), dateFormat)}`}
                    </p>
                )}
            </div>

            <div className="w-full overflow-x-auto pb-10">
                <table className="min-w-full text-[13px] text-left border-collapse">
                    <thead>
                        <tr className="border-y-2 border-gray-300">
                            <th className="py-2.5 px-3 font-semibold text-gray-900 min-w-[200px]">
                                Customer <span className="inline-block ml-1 text-gray-400 text-[10px]">▲</span>
                            </th>
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
                                    <th className="py-2.5 px-3 font-semibold text-gray-900 text-right min-w-[130px] whitespace-nowrap border-l border-gray-200">
                                        Final Balance
                                    </th>
                                </>
                            ) : (
                                <th className="py-2.5 px-3 font-semibold text-gray-900 text-right min-w-[130px] whitespace-nowrap">
                                    Open Balance <span className="inline-block ml-1 text-gray-400 text-[10px]">↕</span>
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {customers.length === 0 ? (
                            <tr>
                                <td colSpan={isMonthWise ? monthCols.length + 2 : 2} className="py-8 text-center text-gray-500">
                                    No customer balances found for the selected date.
                                </td>
                            </tr>
                        ) : (
                            customers.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="py-2 px-3 text-gray-900 min-w-[200px]">
                                        {item.name}
                                        {(item.email || item.phone) && (
                                            <span className="block text-[11px] text-gray-400 mt-0.5 whitespace-nowrap">
                                                {item.email} {item.email && item.phone && '|'} {item.phone}
                                            </span>
                                        )}
                                    </td>
                                    {isMonthWise ? (
                                        <>
                                            {monthCols.map(m => {
                                                const mData = item.monthly_balances?.[m] || 0;
                                                return (
                                                    <td key={m} className="py-2 px-3 text-right whitespace-nowrap">
                                                        <Link href={getDrillDownUrl(item.id, m)} className="hover:underline cursor-pointer decoration-slate-400 underline-offset-4">
                                                            <Currency value={mData} />
                                                        </Link>
                                                    </td>
                                                );
                                            })}
                                            <td className="py-2 px-3 text-right whitespace-nowrap font-bold border-l border-gray-100">
                                                <Link href={getDrillDownUrl(item.id, null)} className="hover:underline cursor-pointer decoration-slate-400 underline-offset-4">
                                                    <Currency value={item.balance} />
                                                </Link>
                                            </td>
                                        </>
                                    ) : (
                                        <td className="py-2 px-3 text-right whitespace-nowrap">
                                            <Link href={getDrillDownUrl(item.id)} className="hover:underline cursor-pointer decoration-slate-400 underline-offset-4">
                                                <Currency value={item.balance} />
                                            </Link>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                        {isMonthWise ? (
                            <tr className="border-t-2 border-b-2 border-gray-400 font-bold bg-white">
                                <td className="py-3 px-3 text-gray-900 uppercase">TOTAL</td>
                                {monthCols.map(m => {
                                    const mTotalAmt = customers.reduce((sum, item) => sum + (item.monthly_balances?.[m] || 0), 0);
                                    return (
                                        <td key={m} className="py-3 px-3 text-right whitespace-nowrap text-gray-900">
                                            <Currency value={mTotalAmt} />
                                        </td>
                                    );
                                })}
                                <td className="py-3 px-3 text-right whitespace-nowrap text-gray-900 border-l border-gray-200">
                                    <Currency value={totalBalance} />
                                </td>
                            </tr>
                        ) : (
                            <tr className="border-t-2 border-b-2 border-gray-400 font-bold bg-white">
                                <td className="py-2.5 px-3 text-gray-900">TOTAL</td>
                                <td className="py-2.5 px-3 text-right whitespace-nowrap text-gray-900">
                                    <Currency value={totalBalance} />
                                </td>
                            </tr>
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
