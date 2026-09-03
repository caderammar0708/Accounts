import React, { useState } from 'react';
import ReportLayout from '@/Layouts/ReportLayout';
import { Head, router, Link } from '@inertiajs/react';
import CommonButton from '@/Components/CommonButton';
import ReportDateFilter from '@/Components/ReportDateFilter';
import { useDateFormat, formatDate } from '@/Utils/dateFormat';
import ReportCurrency from '@/Components/ReportCurrency';

export default function PurchaseByItemSummary({ reportData, filters, auth }) {
    const [collapsedCategories, setCollapsedCategories] = useState({});
    const dateFormat = useDateFormat();

    const toggleCategory = (idx) => {
        setCollapsedCategories(prev => ({
            ...prev,
            [idx]: !prev[idx]
        }));
    };

    const handleFilterChange = (newFilters) => {
        router.get(route('reports.purchase-by-item-summary'), {
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
        router.get(route('reports.purchase-by-item-summary'), {
            ...filters,
            display_by: newDisplayBy,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const categories = reportData || [];
    let totalAmount = 0;
    let totalQuantity = 0;
    categories.forEach(group => {
        group.items.forEach(item => {
            totalAmount += parseFloat(item.total_amount || 0);
            totalQuantity += parseFloat(item.total_qty || 0);
        });
    });

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
        let csvContent = `"${companyName}"\n"Purchase By Item Summary"\n`;
        csvContent += `"Date Range: ${filters.start_date} to ${filters.end_date}"\n\n`;

        if (isMonthWise) {
            csvContent += `"Item Name",`;
            monthCols.forEach(m => {
                csvContent += `"${m} Qty","${m} Amount",`;
            });
            csvContent += `"Total Qty","Total Amount"\n`;

            categories.forEach(group => {
                csvContent += `"${group.category}"\n`;
                group.items.forEach(item => {
                    csvContent += `"${item.name}",`;
                    monthCols.forEach(m => {
                        const mData = item.monthly_totals?.[m] || { qty: 0, amount: 0 };
                        csvContent += `${mData.qty},${mData.amount},`;
                    });
                    csvContent += `${item.total_qty},${item.total_amount}\n`;
                });
                // Optional category total
                const catQty = group.items.reduce((s, i) => s + parseFloat(i.total_qty || 0), 0);
                const catAmt = group.items.reduce((s, i) => s + parseFloat(i.total_amount || 0), 0);
                csvContent += `"Total for ${group.category}",`;
                monthCols.forEach(m => {
                    const mCatQty = group.items.reduce((s, i) => s + parseFloat(i.monthly_totals?.[m]?.qty || 0), 0);
                    const mCatAmt = group.items.reduce((s, i) => s + parseFloat(i.monthly_totals?.[m]?.amount || 0), 0);
                    csvContent += `${mCatQty},${mCatAmt},`;
                });
                csvContent += `${catQty},${catAmt}\n\n`;
            });
        } else {
            csvContent += `"Item Name","Total Quantity","Total Amount (${homeCurrency})"\n`;
            categories.forEach(group => {
                csvContent += `"${group.category}"\n`;
                group.items.forEach(item => {
                    csvContent += `"${item.name}",${item.total_qty},${item.total_amount}\n`;
                });
                const catQty = group.items.reduce((s, i) => s + parseFloat(i.total_qty || 0), 0);
                const catAmt = group.items.reduce((s, i) => s + parseFloat(i.total_amount || 0), 0);
                csvContent += `"Total for ${group.category}",${catQty},${catAmt}\n\n`;
            });
        }
        
        csvContent += `"Grand Total",${totalQuantity},"${totalAmount}"\n`;

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Purchase_By_Item_Summary.csv`);
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
            title="Purchase By Item Summary"
            filters={filterElements}
            onExportExcel={handleExportExcel}
        >
            <Head title="Purchase By Item Summary" />

            <div className="text-center mb-8 font-serif">
                <h2 className="text-xl font-bold text-gray-900">Purchase By Item Summary</h2>
                <h3 className="text-sm text-gray-700 mt-1">{auth.company?.company_name}</h3>
                <p className="text-[13px] text-gray-500 mt-1">
                    {filters.start_date ? formatDate(filters.start_date, dateFormat) : 'Beginning'} - {formatDate(filters.end_date, dateFormat)}
                </p>
            </div>

            <div className="w-full overflow-x-auto pb-10">
                <table className="min-w-full text-[13px] text-left border-collapse">
                    <thead>
                        <tr className="border-y-2 border-gray-300">
                            {isMonthWise ? (
                                <>
                                    <th className="py-2.5 px-3 font-semibold text-gray-900 min-w-[200px]">Item Name</th>
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
                                    <th className="py-2.5 px-3 font-semibold text-gray-900 min-w-[200px]">Item Name</th>
                                    <th className="py-2.5 px-3 font-semibold text-gray-900 text-right whitespace-nowrap min-w-[80px]">Total Qty</th>
                                    <th className="py-2.5 px-3 font-semibold text-gray-900 text-right whitespace-nowrap min-w-[120px]">Total Amount</th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {categories.length === 0 ? (
                            <tr>
                                <td colSpan={isMonthWise ? monthCols.length + 2 : 3} className="py-8 text-center text-gray-500">
                                    No records found for this period.
                                </td>
                            </tr>
                        ) : (
                            categories.map((group, groupIdx) => {
                                const catTotalQty = group.items.reduce((s, i) => s + parseFloat(i.total_qty || 0), 0);
                                const catTotalAmount = group.items.reduce((s, i) => s + parseFloat(i.total_amount || 0), 0);

                                return (
                                    <React.Fragment key={groupIdx}>
                                        <tr 
                                            className="bg-slate-100 border-b border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors"
                                            onClick={() => toggleCategory(groupIdx)}
                                        >
                                            <td colSpan={isMonthWise ? monthCols.length + 2 : 3} className="py-2.5 px-3 font-bold text-gray-800 text-[14px]">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <svg className={`w-4 h-4 mr-2 transition-transform duration-200 ${collapsedCategories[groupIdx] ? '-rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                        {group.category}
                                                    </div>
                                                    {collapsedCategories[groupIdx] && (
                                                        <span className="text-sm font-normal text-gray-500">
                                                            {group.items.length} items (Total: <Currency value={catTotalAmount} />)
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                        {!collapsedCategories[groupIdx] && group.items.map((item) => (
                                            <tr key={item.id} className="bg-white hover:bg-slate-50 transition-colors border-b border-slate-100">
                                                <td className="py-3 px-3 pl-6">
                                                    <Link 
                                                        href={route('reports.purchase-by-item-detail', { 
                                                            item_ids: item.id,
                                                            start_date: filters.start_date,
                                                            end_date: filters.end_date,
                                                            type: filters.type
                                                        })}
                                                        className="flex flex-col text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                                                    >
                                                        <span>{item.name}</span>
                                                        {item.sku && <span className="text-gray-500 font-normal text-xs mt-0.5">SKU: {item.sku}</span>}
                                                    </Link>
                                                </td>
                                                {isMonthWise ? (
                                                    <>
                                                        {monthCols.map(m => {
                                                            const mData = item.monthly_totals?.[m] || { qty: 0, amount: 0 };
                                                            return (
                                                                <td key={m} className="py-3 px-3 text-right whitespace-nowrap">
                                                                    <div className="flex flex-col items-end justify-center">
                                                                        <div className="font-medium text-gray-900">
                                                                            <Currency value={mData.amount} />
                                                                        </div>
                                                                        {mData.qty !== 0 && <div className="text-[11px] text-gray-500 leading-tight mt-0.5">{formatQty(mData.qty)} qty</div>}
                                                                    </div>
                                                                </td>
                                                            );
                                                        })}
                                                        <td className="py-3 px-3 text-right whitespace-nowrap border-l border-gray-100 font-bold bg-slate-50/50">
                                                            <div className="flex flex-col items-end justify-center">
                                                                <div className="text-gray-900"><Currency value={item.total_amount} /></div>
                                                                {item.total_qty !== 0 && <div className="text-gray-500 text-[11px] font-normal leading-tight mt-0.5">{formatQty(item.total_qty)} qty</div>}
                                                            </div>
                                                        </td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className="py-3 px-3 text-right whitespace-nowrap text-gray-700">
                                                            {formatQty(item.total_qty)}
                                                        </td>
                                                        <td className="py-3 px-3 text-right whitespace-nowrap font-semibold text-gray-900">
                                                            <Currency value={item.total_amount} />
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        ))}
                                        {!collapsedCategories[groupIdx] && (
                                            <tr className="bg-slate-50/70 border-b-2 border-slate-200 font-semibold text-gray-800">
                                                <td className="py-2.5 px-3 text-right pr-6">Total for {group.category}</td>
                                                {isMonthWise ? (
                                                    <>
                                                        {monthCols.map(m => {
                                                            const mCatQty = group.items.reduce((s, i) => s + parseFloat(i.monthly_totals?.[m]?.qty || 0), 0);
                                                            const mCatAmt = group.items.reduce((s, i) => s + parseFloat(i.monthly_totals?.[m]?.amount || 0), 0);
                                                            return (
                                                                <td key={m} className="py-2.5 px-3 text-right whitespace-nowrap">
                                                                    <div className="flex flex-col items-end justify-center">
                                                                        <div><Currency value={mCatAmt} /></div>
                                                                        {mCatQty !== 0 && <div className="text-[11px] font-normal text-gray-500 leading-tight mt-0.5">{formatQty(mCatQty)} qty</div>}
                                                                    </div>
                                                                </td>
                                                            );
                                                        })}
                                                        <td className="py-2.5 px-3 text-right whitespace-nowrap border-l border-gray-200">
                                                            <div className="flex flex-col items-end justify-center">
                                                                <div className="text-gray-900"><Currency value={catTotalAmount} /></div>
                                                                {catTotalQty !== 0 && <div className="text-gray-500 text-[11px] font-normal leading-tight mt-0.5">{formatQty(catTotalQty)} qty</div>}
                                                            </div>
                                                        </td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className="py-2.5 px-3 text-right whitespace-nowrap text-gray-800">{formatQty(catTotalQty)}</td>
                                                        <td className="py-2.5 px-3 text-right whitespace-nowrap text-gray-800"><Currency value={catTotalAmount} /></td>
                                                    </>
                                                )}
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </tbody>
                    <tfoot>
                        <tr className="bg-slate-100/70 border-y-2 border-gray-300 font-bold">
                            <td className="py-3 px-3 text-gray-900 text-right pr-6">Grand Total</td>
                            {isMonthWise ? (
                                <>
                                    {monthCols.map(m => {
                                        let mTotalAmount = 0;
                                        let mTotalQty = 0;
                                        categories.forEach(group => {
                                            mTotalAmount += group.items.reduce((s, item) => s + ((item.monthly_totals?.[m]?.amount) || 0), 0);
                                            mTotalQty += group.items.reduce((s, item) => s + ((item.monthly_totals?.[m]?.qty) || 0), 0);
                                        });
                                        
                                        return (
                                            <td key={m} className="py-3 px-3 text-right whitespace-nowrap text-gray-900">
                                                <div className="flex flex-col items-end justify-center">
                                                    <div><Currency value={mTotalAmount} /></div>
                                                    {mTotalQty !== 0 && <div className="text-[11px] font-normal text-gray-600 leading-tight mt-0.5">{formatQty(mTotalQty)} qty</div>}
                                                </div>
                                            </td>
                                        );
                                    })}
                                    <td className="py-3 px-3 text-right whitespace-nowrap text-gray-900 border-l border-gray-200">
                                        <div className="flex flex-col items-end justify-center">
                                            <div><Currency value={totalAmount} /></div>
                                            {totalQuantity !== 0 && <div className="text-[11px] font-normal text-gray-600 leading-tight mt-0.5">{formatQty(totalQuantity)} qty</div>}
                                        </div>
                                    </td>
                                </>
                            ) : (
                                <>
                                    <td className="py-3 px-3 text-right whitespace-nowrap text-gray-900">{formatQty(totalQuantity)}</td>
                                    <td className="py-3 px-3 text-right whitespace-nowrap text-gray-900"><Currency value={totalAmount} /></td>
                                </>
                            )}
                        </tr>
                    </tfoot>
                </table>
            </div>
        </ReportLayout>
    );
}
