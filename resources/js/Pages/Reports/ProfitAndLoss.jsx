import React, { useState } from 'react';
import ReportLayout from '@/Layouts/ReportLayout';
import { Head, Link, router } from '@inertiajs/react';
import CommonButton from '@/Components/CommonButton';
import CommonInput from '@/Components/CommonInput';
import { useDateFormat, formatDate } from '@/Utils/dateFormat';
import ReportDateFilter from '@/Components/ReportDateFilter';

import ReportCurrency from '@/Components/ReportCurrency';

export default function ProfitAndLoss({ reportData, filters, auth }) {
    const dateFormat = useDateFormat();
    const [displayBy, setDisplayBy] = useState(filters.display_by || 'total');
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
        router.get(route('reports.profit-loss'), { 
            start_date: newFilters.start_date, 
            end_date: newFilters.end_date,
            display_by: displayBy,
            type: newFilters.type 
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const toggleDisplayBy = () => {
        const val = displayBy === 'total' ? 'month' : 'total';
        setDisplayBy(val);
        router.get(route('reports.profit-loss'), { 
            start_date: filters.start_date, 
            end_date: filters.end_date,
            display_by: val,
            type: filters.type
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const income = reportData.income || [];
    const cogs = reportData.cogs || [];
    const expense = reportData.expense || [];

    const totalIncome = income.reduce((sum, item) => sum + item.total_balance, 0);
    const totalCogs = cogs.reduce((sum, item) => sum + item.total_balance, 0);
    const grossProfit = totalIncome - totalCogs;
    const totalExpense = expense.reduce((sum, item) => sum + item.total_balance, 0);
    const netIncome = grossProfit - totalExpense;

    const homeCurrency = auth.company?.home_currency_prefix || auth.company?.home_currency || '';

    const Currency = ({ value, className = '' }) => (
        <ReportCurrency value={value} currency={homeCurrency} className={className} />
    );

    const isMonthWise = filters.display_by === 'month';
    const monthCols = filters.months || [];
    const formatMonth = (ym) => {
        const [y, m] = ym.split('-');
        const d = new Date(y, parseInt(m) - 1, 1);
        return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(d);
    };

    const totalIncomeMonthly = {};
    const totalCogsMonthly = {};
    const grossProfitMonthly = {};
    const totalExpenseMonthly = {};
    const netIncomeMonthly = {};

    if (isMonthWise) {
        monthCols.forEach(ym => {
            totalIncomeMonthly[ym] = income.reduce((sum, item) => sum + (item.total_monthly_balances?.[ym] || 0), 0);
            totalCogsMonthly[ym] = cogs.reduce((sum, item) => sum + (item.total_monthly_balances?.[ym] || 0), 0);
            grossProfitMonthly[ym] = totalIncomeMonthly[ym] - totalCogsMonthly[ym];
            totalExpenseMonthly[ym] = expense.reduce((sum, item) => sum + (item.total_monthly_balances?.[ym] || 0), 0);
            netIncomeMonthly[ym] = grossProfitMonthly[ym] - totalExpenseMonthly[ym];
        });
    }

    const flattenAccounts = (accounts, prefix = "") => {
        let flattened = [];
        accounts.forEach(acc => {
            flattened.push({
                name: prefix + acc.name,
                balance: acc.balance,
                monthly_balances: acc.monthly_balances
            });
            if (acc.children && acc.children.length > 0) {
                flattened = flattened.concat(flattenAccounts(acc.children, prefix + "  "));
                flattened.push({
                    name: prefix + "Total " + acc.name,
                    balance: acc.total_balance,
                    monthly_balances: acc.total_monthly_balances
                });
            }
        });
        return flattened;
    };

    const handleExportExcel = () => {
        const companyName = auth.company?.company_name || 'Company';
        const startDate = filters.start_date;
        const endDate = filters.end_date;

        let csvContent = "";

        // Add Title Header
        csvContent += `"${companyName}"\n`;
        csvContent += `"Profit and Loss"\n`;
        csvContent += `"${formatDate(startDate, dateFormat)} - ${formatDate(endDate, dateFormat)}"\n\n`;

        // Headers
        csvContent += `"Category","Account Name"`;
        if (isMonthWise) {
            monthCols.forEach(ym => {
                csvContent += `,"${formatMonth(ym)}"`;
            });
        }
        csvContent += `,"Balance (${homeCurrency})"\n`;

        // Income
        csvContent += `"INCOME"\n`;
        const flatIncome = flattenAccounts(income);
        flatIncome.forEach(item => {
            let row = `,"${item.name}"`;
            if (isMonthWise) {
                monthCols.forEach(ym => row += `,${item.monthly_balances?.[ym] || 0}`);
            }
            row += `,${item.balance}\n`;
            csvContent += row;
        });
        let incomeTotalRow = `,"Total Income"`;
        if (isMonthWise) {
            monthCols.forEach(ym => incomeTotalRow += `,${totalIncomeMonthly[ym] || 0}`);
        }
        incomeTotalRow += `,${totalIncome}\n\n`;
        csvContent += incomeTotalRow;

        // Cost of Goods Sold
        csvContent += `"COST OF GOODS SOLD"\n`;
        const flatCogs = flattenAccounts(cogs);
        flatCogs.forEach(item => {
            let row = `,"${item.name}"`;
            if (isMonthWise) {
                monthCols.forEach(ym => row += `,${item.monthly_balances?.[ym] || 0}`);
            }
            row += `,${item.balance}\n`;
            csvContent += row;
        });
        let cogsTotalRow = `,"Total Cost of Goods Sold"`;
        if (isMonthWise) {
            monthCols.forEach(ym => cogsTotalRow += `,${totalCogsMonthly[ym] || 0}`);
        }
        cogsTotalRow += `,${totalCogs}\n`;
        csvContent += cogsTotalRow;

        // Gross Profit
        let grossProfitRow = `,"GROSS PROFIT"`;
        if (isMonthWise) {
            monthCols.forEach(ym => grossProfitRow += `,${grossProfitMonthly[ym] || 0}`);
        }
        grossProfitRow += `,${grossProfit}\n\n`;
        csvContent += grossProfitRow;

        // Expenses
        csvContent += `"EXPENSES"\n`;
        const flatExpense = flattenAccounts(expense);
        flatExpense.forEach(item => {
            let row = `,"${item.name}"`;
            if (isMonthWise) {
                monthCols.forEach(ym => row += `,${item.monthly_balances?.[ym] || 0}`);
            }
            row += `,${item.balance}\n`;
            csvContent += row;
        });
        let expenseTotalRow = `,"Total Expenses"`;
        if (isMonthWise) {
            monthCols.forEach(ym => expenseTotalRow += `,${totalExpenseMonthly[ym] || 0}`);
        }
        expenseTotalRow += `,${totalExpense}\n\n`;
        csvContent += expenseTotalRow;

        // Net Income
        let netIncomeRow = `,"Net Income"`;
        if (isMonthWise) {
            monthCols.forEach(ym => netIncomeRow += `,${netIncomeMonthly[ym] || 0}`);
        }
        netIncomeRow += `,${netIncome}\n`;
        csvContent += netIncomeRow;

        // Create download blob
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${companyName.replace(/[^a-z0-9]/gi, '_')}_Profit_And_Loss_${startDate}_to_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filterElements = (
        <div className="flex flex-row flex-wrap items-end gap-3 mb-4">
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

    const getDrillDownUrl = (accountId, monthCol = null) => {
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
            params.set('type', filters.type || 'custom');
        }
        const qs = params.toString();
        return route('chart-of-account.history', accountId) + (qs ? `?${qs}` : '');
    };

    const AccountRow = ({ item, depth = 0 }) => {
        const hasChildren = item.children && item.children.length > 0;
        const isCollapsed = collapsedGroups.has(item.id);
        const paddingLeft = `${1.5 + depth * 1.5}rem`;

        return (
            <React.Fragment>
                <tr 
                    className={`hover:bg-gray-50 transition-colors ${hasChildren ? 'cursor-pointer' : ''}`}
                    onClick={() => hasChildren && toggleGroup(item.id)}
                >
                    <td className="py-2 px-3 text-gray-900 min-w-[200px]" style={{ paddingLeft }}>
                        {hasChildren && (
                            <span className="inline-block mr-2 text-[10px] w-3 text-center text-gray-500">
                                {isCollapsed ? '▶' : '▼'}
                            </span>
                        )}
                        {item.name}
                    </td>
                    {isMonthWise && monthCols.map(ym => {
                        const displayVal = (hasChildren && isCollapsed) ? item.total_monthly_balances?.[ym] : item.monthly_balances?.[ym];
                        
                        return (
                            <td key={ym} className="py-2 px-3 text-right whitespace-nowrap min-w-[120px]">
                                {(hasChildren && !isCollapsed && (item.monthly_balances?.[ym] || 0) === 0) ? null : (
                                    <Link href={getDrillDownUrl(item.id, ym)} className="hover:underline cursor-pointer decoration-slate-400 underline-offset-4" onClick={(e) => hasChildren && e.stopPropagation()}>
                                        <Currency value={displayVal || 0} />
                                    </Link>
                                )}
                            </td>
                        );
                    })}
                    <td className="py-2 px-3 text-right whitespace-nowrap min-w-[130px]">
                        {(() => {
                            const displayVal = (hasChildren && isCollapsed) ? item.total_balance : item.balance;
                            if (hasChildren && !isCollapsed && item.balance === 0) return null;
                            return (
                                <Link href={getDrillDownUrl(item.id)} className="hover:underline cursor-pointer decoration-slate-400 underline-offset-4 font-medium" onClick={(e) => hasChildren && e.stopPropagation()}>
                                    <Currency value={displayVal || 0} />
                                </Link>
                            );
                        })()}
                    </td>
                </tr>
                {hasChildren && !isCollapsed && item.children.map(child => (
                    <AccountRow key={child.id} item={child} depth={depth + 1} />
                ))}
                {hasChildren && !isCollapsed && (
                    <tr className="hover:bg-gray-50 transition-colors font-medium border-t border-gray-100">
                        <td className="py-2 px-3 text-gray-700" style={{ paddingLeft }}>
                            Total {item.name}
                        </td>
                        {isMonthWise && monthCols.map(ym => (
                            <td key={ym} className="py-2 px-3 text-right whitespace-nowrap">
                                <Currency value={item.total_monthly_balances?.[ym] || 0} />
                            </td>
                        ))}
                        <td className="py-2 px-3 text-right whitespace-nowrap border-t border-gray-200">
                            <Currency value={item.total_balance} />
                        </td>
                    </tr>
                )}
            </React.Fragment>
        );
    };

    return (
        <ReportLayout
            title="Profit and Loss"
            filters={filterElements}
            onExportExcel={handleExportExcel}
        >
            <Head title="Profit and Loss" />

            <div className="text-center mb-8 font-serif">
                <h2 className="text-xl font-bold text-gray-900">Profit and Loss Summary</h2>
                <h3 className="text-sm text-gray-700 mt-1">{auth.company?.company_name}</h3>
                {filters.type === 'all_dates' ? (
                    <p className="text-[13px] text-gray-500 mt-1">All Dates</p>
                ) : (
                    <p className="text-[13px] text-gray-500 mt-1">
                        {formatDate(filters.start_date, dateFormat)} - {formatDate(filters.end_date, dateFormat)}
                    </p>
                )}
            </div>

            <div className="w-full overflow-x-auto pb-10">
                <table className="min-w-full text-[13px] text-left border-collapse">
                    <thead>
                        <tr className="border-y-2 border-gray-300">
                            <th className="py-2.5 px-3 font-semibold text-gray-900 min-w-[200px]">
                                Account
                            </th>
                            {isMonthWise && monthCols.map(ym => (
                                <th key={ym} className="py-2.5 px-3 font-semibold text-gray-900 text-right min-w-[120px] whitespace-nowrap">
                                    {formatMonth(ym)}
                                </th>
                            ))}
                            <th className="py-2.5 px-3 font-semibold text-gray-900 text-right min-w-[130px] whitespace-nowrap">
                                Total <span className="inline-block ml-1 text-gray-400 text-[10px]">↕</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {/* Income Section */}
                        <tr 
                            className="bg-gray-50 border-y border-gray-300 cursor-pointer hover:bg-gray-100"
                            onClick={() => toggleGroup('Income')}
                        >
                            <td className="py-2 px-3 font-bold text-gray-900">
                                <span className="inline-block mr-1 text-[10px] w-3 text-center text-gray-600">
                                    {collapsedGroups.has('Income') ? '▶' : '▼'}
                                </span> Income
                            </td>
                            {isMonthWise && monthCols.map(ym => (
                                <td key={ym} className="py-2 px-3 text-right whitespace-nowrap text-gray-900 font-bold">
                                    {collapsedGroups.has('Income') && <Currency value={totalIncomeMonthly[ym] || 0} />}
                                </td>
                            ))}
                            <td className="py-2 px-3 text-right whitespace-nowrap text-gray-900 font-bold">
                                {collapsedGroups.has('Income') && <Currency value={totalIncome} />}
                            </td>
                        </tr>
                        {!collapsedGroups.has('Income') && income.map((item) => (
                            <AccountRow key={item.id} item={item} />
                        ))}
                        {!collapsedGroups.has('Income') && (
                            <tr className="border-t border-b-2 border-gray-300 bg-white font-semibold">
                                <td className="py-2 px-3 pl-8 text-gray-900">Total Income</td>
                                {isMonthWise && monthCols.map(ym => (
                                    <td key={ym} className="py-2 px-3 text-right whitespace-nowrap text-gray-900"><Currency value={totalIncomeMonthly[ym] || 0} /></td>
                                ))}
                                <td className="py-2 px-3 text-right whitespace-nowrap text-gray-900"><Currency value={totalIncome} /></td>
                            </tr>
                        )}

                        {/* Cost of Goods Sold Section */}
                        <tr 
                            className="bg-gray-50 border-y border-gray-300 cursor-pointer hover:bg-gray-100"
                            onClick={() => toggleGroup('COGS')}
                        >
                            <td className="py-2 px-3 font-bold text-gray-900 mt-4">
                                <span className="inline-block mr-1 text-[10px] w-3 text-center text-gray-600">
                                    {collapsedGroups.has('COGS') ? '▶' : '▼'}
                                </span> Cost of Goods Sold
                            </td>
                            {isMonthWise && monthCols.map(ym => (
                                <td key={ym} className="py-2 px-3 text-right whitespace-nowrap text-gray-900 font-bold">
                                    {collapsedGroups.has('COGS') && <Currency value={totalCogsMonthly[ym] || 0} />}
                                </td>
                            ))}
                            <td className="py-2 px-3 text-right whitespace-nowrap text-gray-900 font-bold">
                                {collapsedGroups.has('COGS') && <Currency value={totalCogs} />}
                            </td>
                        </tr>
                        {!collapsedGroups.has('COGS') && cogs.map((item) => (
                            <AccountRow key={item.id} item={item} />
                        ))}
                        {!collapsedGroups.has('COGS') && (
                            <tr className="border-t border-b border-gray-300 bg-white font-semibold">
                                <td className="py-2 px-3 pl-8 text-gray-900">Total Cost of Goods Sold</td>
                                {isMonthWise && monthCols.map(ym => (
                                    <td key={ym} className="py-2 px-3 text-right whitespace-nowrap text-gray-900"><Currency value={totalCogsMonthly[ym] || 0} /></td>
                                ))}
                                <td className="py-2 px-3 text-right whitespace-nowrap text-gray-900"><Currency value={totalCogs} /></td>
                            </tr>
                        )}

                        {/* Gross Profit */}
                        <tr className="border-b-2 border-gray-300 font-bold bg-white text-[13px]">
                            <td className="py-2.5 px-3 pl-8 text-gray-900">GROSS PROFIT</td>
                            {isMonthWise && monthCols.map(ym => (
                                <td key={ym} className="py-2.5 px-3 text-right whitespace-nowrap text-gray-900"><Currency value={grossProfitMonthly[ym] || 0} /></td>
                            ))}
                            <td className="py-2.5 px-3 text-right whitespace-nowrap text-gray-900"><Currency value={grossProfit} /></td>
                        </tr>

                        {/* Expense Section */}
                        <tr 
                            className="bg-gray-50 border-y border-gray-300 cursor-pointer hover:bg-gray-100"
                            onClick={() => toggleGroup('Expense')}
                        >
                            <td className="py-2 px-3 font-bold text-gray-900 mt-4">
                                <span className="inline-block mr-1 text-[10px] w-3 text-center text-gray-600">
                                    {collapsedGroups.has('Expense') ? '▶' : '▼'}
                                </span> Expenses
                            </td>
                            {isMonthWise && monthCols.map(ym => (
                                <td key={ym} className="py-2 px-3 text-right whitespace-nowrap text-gray-900 font-bold">
                                    {collapsedGroups.has('Expense') && <Currency value={totalExpenseMonthly[ym] || 0} />}
                                </td>
                            ))}
                            <td className="py-2 px-3 text-right whitespace-nowrap text-gray-900 font-bold">
                                {collapsedGroups.has('Expense') && <Currency value={totalExpense} />}
                            </td>
                        </tr>
                        {!collapsedGroups.has('Expense') && expense.map((item) => (
                            <AccountRow key={item.id} item={item} />
                        ))}
                        {!collapsedGroups.has('Expense') && (
                            <tr className="border-t border-b-2 border-gray-300 bg-white font-semibold">
                                <td className="py-2 px-3 pl-8 text-gray-900">Total Expenses</td>
                                {isMonthWise && monthCols.map(ym => (
                                    <td key={ym} className="py-2 px-3 text-right whitespace-nowrap text-gray-900"><Currency value={totalExpenseMonthly[ym] || 0} /></td>
                                ))}
                                <td className="py-2 px-3 text-right whitespace-nowrap text-gray-900"><Currency value={totalExpense} /></td>
                            </tr>
                        )}

                        {/* Net Income */}
                        <tr className="border-t-2 border-b-4 border-gray-400 font-bold bg-white text-[14px]">
                            <td className="py-3 px-3 text-gray-900">NET INCOME</td>
                            {isMonthWise && monthCols.map(ym => (
                                <td key={ym} className="py-3 px-3 text-right whitespace-nowrap text-gray-900"><Currency value={netIncomeMonthly[ym] || 0} /></td>
                            ))}
                            <td className="py-3 px-3 text-right whitespace-nowrap text-gray-900"><Currency value={netIncome} /></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="mt-20 text-[10px] text-slate-400 font-bold text-center uppercase tracking-widest italic">
                Accrual Basis | Generated on {formatDate(new Date(), dateFormat)}
            </div>
        </ReportLayout>
    );
}
