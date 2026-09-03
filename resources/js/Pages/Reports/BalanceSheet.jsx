import React, { useEffect, useState } from 'react';
import ReportLayout from '@/Layouts/ReportLayout';
import { Head, Link, router } from '@inertiajs/react';
import CommonButton from '@/Components/CommonButton';
import CommonInput from '@/Components/CommonInput';
import { useDateFormat, formatDate } from '@/Utils/dateFormat';
import ReportDateFilter from '@/Components/ReportDateFilter';
import ReportCurrency from '@/Components/ReportCurrency';
import ShowAccountCodesToggle, { formatAccountDisplayName, useAccountCodesToggle } from '@/Components/ShowAccountCodesToggle';

export default function BalanceSheet({ reportData, filters, auth }) {
    const dateFormat = useDateFormat();
    const [displayBy, setDisplayBy] = useState(filters.display_by || 'total');
    const [collapsedGroups, setCollapsedGroups] = useState(new Set());
    const [showAccountCodes, toggleShowAccountCodes] = useAccountCodesToggle(filters?.show_codes);

    useEffect(() => {
        setDisplayBy(filters.display_by || 'total');
    }, [filters.display_by]);

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
        router.get(route('reports.balance-sheet'), { 
            end_date: newFilters.end_date,
            start_date: newFilters.start_date,
            display_by: displayBy,
            type: newFilters.type,
            show_codes: showAccountCodes ? '1' : undefined
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const toggleDisplayBy = () => {
        const val = displayBy === 'total' ? 'month' : 'total';
        setDisplayBy(val);
        router.get(route('reports.balance-sheet'), { 
            end_date: filters.end_date,
            start_date: filters.start_date,
            display_by: val,
            type: filters.type,
            show_codes: showAccountCodes ? '1' : undefined
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const asset = reportData.asset || [];
    const liability = reportData.liability || [];
    const equity = reportData.equity || [];

    const totalAsset = asset.reduce((sum, item) => sum + item.total_balance, 0);
    const totalLiability = liability.reduce((sum, item) => sum + item.total_balance, 0);
    const totalEquity = equity.reduce((sum, item) => sum + item.total_balance, 0);
    const totalLiabilityEquity = totalLiability + totalEquity;

    const homeCurrency = auth.company?.home_currency_prefix || auth.company?.home_currency || '';

    const Currency = ({ value, className = '' }) => (
        <ReportCurrency value={value} currency={homeCurrency} className={className} />
    );

    const flattenAccounts = (accounts, prefix = "") => {
        let flattened = [];
        accounts.forEach(acc => {
            const displayName = formatAccountDisplayName(acc, null, showAccountCodes);
            flattened.push({ name: prefix + displayName, balance: acc.balance });
            if (acc.children && acc.children.length > 0) {
                flattened = flattened.concat(flattenAccounts(acc.children, prefix + "  "));
                flattened.push({ name: prefix + "Total " + acc.name, balance: acc.total_balance });
            }
        });
        return flattened;
    };

    const handleExportExcel = () => {
        const companyName = auth.company?.company_name || 'Company';
        const endDate = filters.end_date;

        let csvContent = "";

        // Add Title Header
        csvContent += `"${companyName}"\n`;
        csvContent += `"Balance Sheet"\n`;
        csvContent += `"As of ${formatDate(endDate, dateFormat)}"\n\n`;

        // Headers
        csvContent += `"Category","Account Name","Balance (${homeCurrency})"\n`;

        // Assets
        csvContent += `"ASSETS"\n`;
        const flatAsset = flattenAccounts(asset);
        flatAsset.forEach(item => {
            csvContent += `,"${item.name}",${item.balance}\n`;
        });
        csvContent += `,"Total Assets",${totalAsset}\n\n`;

        // Liabilities & Equity
        csvContent += `"LIABILITIES AND EQUITY"\n`;
        csvContent += `"Liabilities"\n`;
        const flatLiability = flattenAccounts(liability);
        flatLiability.forEach(item => {
            csvContent += `,"${item.name}",${item.balance}\n`;
        });
        csvContent += `,"Total Liabilities",${totalLiability}\n\n`;

        csvContent += `"Equity"\n`;
        const flatEquity = flattenAccounts(equity);
        flatEquity.forEach(item => {
            csvContent += `,"${item.name}",${item.balance}\n`;
        });
        csvContent += `,"Total Equity",${totalEquity}\n\n`;

        csvContent += `,"Total Liabilities and Equity",${totalLiabilityEquity}\n`;

        // Create download blob
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${companyName.replace(/[^a-z0-9]/gi, '_')}_Balance_Sheet_As_Of_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const isMonthWise = displayBy === 'month';
    const monthCols = filters.months || [];
    const formatMonth = (ym) => {
        const [y, m] = ym.split('-');
        const d = new Date(y, parseInt(m, 10) - 1, 1);
        return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(d);
    };

    const totalAssetMonthly = {};
    const totalLiabilityMonthly = {};
    const totalEquityMonthly = {};
    const totalLiabilityEquityMonthly = {};

    if (isMonthWise) {
        monthCols.forEach(ym => {
            totalAssetMonthly[ym] = asset.reduce((sum, item) => sum + (item.total_monthly_balances?.[ym] || 0), 0);
            totalLiabilityMonthly[ym] = liability.reduce((sum, item) => sum + (item.total_monthly_balances?.[ym] || 0), 0);
            totalEquityMonthly[ym] = equity.reduce((sum, item) => sum + (item.total_monthly_balances?.[ym] || 0), 0);
            totalLiabilityEquityMonthly[ym] = totalLiabilityMonthly[ym] + totalEquityMonthly[ym];
        });
    }

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
            <ShowAccountCodesToggle
                enabled={showAccountCodes}
                onToggle={toggleShowAccountCodes}
            />
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
        const displayName = formatAccountDisplayName(item, null, showAccountCodes);

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
                        {displayName}
                    </td>
                    {isMonthWise && monthCols.map(ym => {
                        const displayVal = item.monthly_balances?.[ym] || 0;

                        return (
                            <td key={ym} className="py-2 px-3 text-right whitespace-nowrap min-w-[120px]">
                                {hasChildren && displayVal === 0 ? null : (
                                    <Link href={getDrillDownUrl(item.id, ym)} className="hover:underline cursor-pointer decoration-slate-400 underline-offset-4">
                                        <Currency value={displayVal} />
                                    </Link>
                                )}
                            </td>
                        );
                    })}
                    <td className="py-2 px-3 text-right whitespace-nowrap min-w-[130px]">
                        {hasChildren && item.balance === 0 ? null : (
                            <Link href={getDrillDownUrl(item.id)} className="hover:underline cursor-pointer decoration-slate-400 underline-offset-4">
                                <Currency value={item.balance} />
                            </Link>
                        )}
                    </td>
                </tr>
                {!isCollapsed && hasChildren && item.children.map(child => (
                    <AccountRow key={child.id} item={child} depth={depth + 1} />
                ))}
                {hasChildren && (
                    <tr className="hover:bg-gray-50 transition-colors font-medium border-t border-gray-100">
                        <td className="py-2 px-3 text-gray-700" style={{ paddingLeft: `${1.5 + depth * 1.5}rem` }}>
                            Total {item.name}
                        </td>
                        {isMonthWise && monthCols.map(ym => (
                            <td key={ym} className="py-2 px-3 text-right whitespace-nowrap">
                                <Currency value={item.total_monthly_balances?.[ym] || 0} />
                            </td>
                        ))}
                        <td className="py-2 px-3 text-right whitespace-nowrap">
                            <Currency value={item.total_balance} />
                        </td>
                    </tr>
                )}
            </React.Fragment>
        );
    };

    return (
        <ReportLayout
            title="Balance Sheet"
            filters={filterElements}
            onExportExcel={handleExportExcel}
        >
            <Head title="Balance Sheet" />

            <div className="text-center mb-8 font-serif">
                <h2 className="text-xl font-bold text-gray-900">Balance Sheet</h2>
                <h3 className="text-sm text-gray-700 mt-1">{auth.company?.company_name}</h3>
                {filters.type === 'all_dates' ? (
                    <p className="text-[13px] text-gray-500 mt-1">All Dates</p>
                ) : (
                    <p className="text-[13px] text-gray-500 mt-1">
                        As of {formatDate(filters.end_date, dateFormat)}
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
                        {/* Assets Section */}
                        <tr className="bg-gray-50 border-y border-gray-300 cursor-pointer" onClick={() => toggleGroup('Assets')}>
                            <td colSpan={2 + (isMonthWise ? monthCols.length : 0)} className="py-2 px-3 font-bold text-gray-900">
                                <span className="inline-block mr-1 text-[10px]">
                                    {collapsedGroups.has('Assets') ? '▶' : '▼'}
                                </span>
                                ASSETS
                                {collapsedGroups.has('Assets') && (
                                    <span className="ml-4 text-sm font-semibold"><Currency value={totalAsset} /></span>
                                )}
                            </td>
                        </tr>
                        {!collapsedGroups.has('Assets') && asset.map((item) => (
                            <AccountRow key={item.id} item={item} />
                        ))}
                        <tr className="border-t border-b-2 border-gray-300 bg-white font-semibold">
                            <td className="py-2 px-3 pl-8 text-gray-900">Total Assets</td>
                            {isMonthWise && monthCols.map(ym => (
                                <td key={ym} className="py-2 px-3 text-right tabular-nums text-gray-900">
                                    <Currency value={totalAssetMonthly[ym] || 0} />
                                </td>
                            ))}
                            <td className="py-2 px-3 text-right tabular-nums text-gray-900"><Currency value={totalAsset} /></td>
                        </tr>

                        {/* Liabilities & Equity Section */}
                        <tr className="bg-gray-50 border-y border-gray-300 cursor-pointer" onClick={() => toggleGroup('LiabilitiesAndEquity')}>
                            <td colSpan={2 + (isMonthWise ? monthCols.length : 0)} className="py-2 px-3 font-bold text-gray-900 mt-4">
                                <span className="inline-block mr-1 text-[10px]">
                                    {collapsedGroups.has('LiabilitiesAndEquity') ? '▶' : '▼'}
                                </span>
                                LIABILITIES AND EQUITY
                                {collapsedGroups.has('LiabilitiesAndEquity') && (
                                    <span className="ml-4 text-sm font-semibold"><Currency value={totalLiabilityEquity} /></span>
                                )}
                            </td>
                        </tr>

                        {!collapsedGroups.has('LiabilitiesAndEquity') && (
                            <>
                                {/* Liabilities Sub-section */}
                                <tr className="bg-white cursor-pointer" onClick={() => toggleGroup('Liabilities')}>
                                    <td colSpan={2 + (isMonthWise ? monthCols.length : 0)} className="py-2 px-3 pl-6 font-semibold text-gray-700 italic">
                                        <span className="inline-block mr-1 text-[10px]">
                                            {collapsedGroups.has('Liabilities') ? '▶' : '▼'}
                                        </span>
                                        Liabilities
                                        {collapsedGroups.has('Liabilities') && (
                                            <span className="ml-4 text-sm font-semibold"><Currency value={totalLiability} /></span>
                                        )}
                                    </td>
                                </tr>
                                {!collapsedGroups.has('Liabilities') && liability.map((item) => (
                                    <AccountRow key={item.id} item={item} />
                                ))}
                                <tr className="border-t border-gray-200 bg-white font-medium">
                                    <td className="py-2 px-3 pl-8 text-gray-900">Total Liabilities</td>
                                    {isMonthWise && monthCols.map(ym => (
                                        <td key={ym} className="py-2 px-3 text-right whitespace-nowrap text-gray-900">
                                            <Currency value={totalLiabilityMonthly[ym] || 0} />
                                        </td>
                                    ))}
                                    <td className="py-2 px-3 text-right whitespace-nowrap text-gray-900"><Currency value={totalLiability} /></td>
                                </tr>

                                {/* Equity Sub-section */}
                                <tr className="bg-white mt-2 cursor-pointer" onClick={() => toggleGroup('Equity')}>
                                    <td colSpan={2 + (isMonthWise ? monthCols.length : 0)} className="py-2 px-3 pl-6 font-semibold text-gray-700 italic border-t border-gray-100">
                                        <span className="inline-block mr-1 text-[10px]">
                                            {collapsedGroups.has('Equity') ? '▶' : '▼'}
                                        </span>
                                        Equity
                                        {collapsedGroups.has('Equity') && (
                                            <span className="ml-4 text-sm font-semibold"><Currency value={totalEquity} /></span>
                                        )}
                                    </td>
                                </tr>
                                {!collapsedGroups.has('Equity') && equity.map((item) => (
                                    <AccountRow key={item.id} item={item} />
                                ))}
                                <tr className="border-t border-gray-200 bg-white font-medium">
                                    <td className="py-2 px-3 pl-8 text-gray-900">Total Equity</td>
                                    {isMonthWise && monthCols.map(ym => (
                                        <td key={ym} className="py-2 px-3 text-right whitespace-nowrap text-gray-900">
                                            <Currency value={totalEquityMonthly[ym] || 0} />
                                        </td>
                                    ))}
                                    <td className="py-2 px-3 text-right whitespace-nowrap text-gray-900"><Currency value={totalEquity} /></td>
                                </tr>
                            </>
                        )}

                        {collapsedGroups.has('LiabilitiesAndEquity') && (
                            <>
                                <tr className="border-t border-gray-200 bg-white font-medium">
                                    <td className="py-2 px-3 pl-8 text-gray-900">Total Liabilities</td>
                                    {isMonthWise && monthCols.map(ym => (
                                        <td key={ym} className="py-2 px-3 text-right whitespace-nowrap text-gray-900">
                                            <Currency value={totalLiabilityMonthly[ym] || 0} />
                                        </td>
                                    ))}
                                    <td className="py-2 px-3 text-right whitespace-nowrap text-gray-900"><Currency value={totalLiability} /></td>
                                </tr>
                                <tr className="border-t border-gray-200 bg-white font-medium">
                                    <td className="py-2 px-3 pl-8 text-gray-900">Total Equity</td>
                                    {isMonthWise && monthCols.map(ym => (
                                        <td key={ym} className="py-2 px-3 text-right whitespace-nowrap text-gray-900">
                                            <Currency value={totalEquityMonthly[ym] || 0} />
                                        </td>
                                    ))}
                                    <td className="py-2 px-3 text-right whitespace-nowrap text-gray-900"><Currency value={totalEquity} /></td>
                                </tr>
                            </>
                        )}



                        <tr className="border-t-2 border-b-4 border-gray-400 font-bold bg-white text-[14px]">
                            <td className="py-3 px-3 text-gray-900">TOTAL LIABILITIES AND EQUITY</td>
                            {isMonthWise && monthCols.map(ym => (
                                <td key={ym} className="py-3 px-3 text-right whitespace-nowrap text-gray-900">
                                    <Currency value={totalLiabilityEquityMonthly[ym] || 0} />
                                </td>
                            ))}
                            <td className="py-3 px-3 text-right whitespace-nowrap text-gray-900"><Currency value={totalLiabilityEquity} /></td>
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
