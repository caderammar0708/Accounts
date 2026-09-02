import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import CommonButton from '@/Components/CommonButton';
import Dropdown from '@/Components/Dropdown';
import QuickAddAccount from '@/Components/QuickAddAccount';

export default function ChartOfAccIndex({ auth, chartOfAccounts = [], currencies = [], multi_currency_enabled, home_currency_id, locations = [] }) {
    const company = auth.company;

    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [initialParent, setInitialParent] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

    const handleOpenCreate = (parentAccount = null) => {
        const isActualAccount = parentAccount && typeof parentAccount === 'object' && 'id' in parentAccount;
        setSelectedId(null);
        setInitialParent(isActualAccount ? parentAccount : null);
        setIsPanelOpen(true);
    };

    const handleOpenEdit = (account) => {
        setSelectedId(account.id);
        setInitialParent(null);
        setIsPanelOpen(true);
    };

    const handleSuccess = (newAccount, isSaveAndNew = false) => {
        if (!isSaveAndNew) {
            setIsPanelOpen(false);
        } else {
            handleOpenCreate();
        }
    };

    const handleToggleActive = (account) => {
        const actionText = account.is_active ? "inactive" : "active";
        if (confirm(`Are you sure you want to make this account ${actionText}?`)) {
            router.patch(route('chart-of-account.update', account.id), {
                is_active: !account.is_active
            }, {
                preserveScroll: true
            });
        }
    };

    const handleToggleLock = (account) => {
        const actionText = account.is_locked ? "unlock" : "lock";
        if (confirm(`Are you sure you want to ${actionText} this account?`)) {
            router.patch(route('chart-of-account.update', account.id), {
                is_locked: !account.is_locked
            }, {
                preserveScroll: true
            });
        }
    };

    const filteredAccounts = chartOfAccounts.filter(acc => {
        const matchesSearch = (acc.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (acc.account_code?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || acc.account_type === filterType;
        return matchesSearch && matchesType;
    });

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-bold text-lg text-slate-800 tracking-tight">Chart of Accounts</h2>
            }
        >
            <Head title="Chart of Accounts" />

            <div className="p-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* Toolbar */}
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Filter by name or number"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="pl-9 pr-4 py-1 border border-slate-300 rounded-md text-[11px] w-64 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                                />
                            </div>

                            <select
                                value={filterType}
                                onChange={e => setFilterType(e.target.value)}
                                className="pl-3 pr-1 py-1 border border-slate-200 rounded-md text-[11px] font-bold text-slate-600 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 min-w-[125px]"
                            >
                                <option value="all">All Types</option>
                                <option value="asset">Assets</option>
                                <option value="liability">Liabilities</option>
                                <option value="equity">Equity</option>
                                <option value="income">Income</option>
                                <option value="expense">Expenses</option>
                            </select>
                        </div>

                        <CommonButton
                            variant="primary"
                            onClick={handleOpenCreate}
                        >
                            New account
                        </CommonButton>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Name / Code</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Type</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Detail Type</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Description</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Balance</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredAccounts.map((account, index) => {
                                    const isLastItems = index >= filteredAccounts.length - 2 && filteredAccounts.length > 3;
                                    return (
                                        <tr key={account.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-4 py-2.5" style={{ paddingLeft: account.parent_id ? '28px' : '16px' }}>
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                                                        {account.parent_id && (
                                                            <span className="text-slate-300 font-normal">↳</span>
                                                        )}
                                                        {account.name}
                                                        {account.is_locked ? (
                                                            <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" title="Locked Account">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                            </svg>
                                                        ) : null}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 flex items-center gap-1.5">
                                                        {account.account_code}
                                                        {!account.is_active && (
                                                            <span className="bg-slate-100 text-slate-500 px-1 py-0.5 rounded text-[8px] uppercase tracking-wider font-bold">Inactive</span>
                                                        )}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2.5 text-[11px] text-slate-600 capitalize">{account.account_type}</td>
                                            <td className="px-4 py-2.5 text-[11px] text-slate-600 capitalize">{account.sub_type?.replace(/-/g, ' ') || 'Main Account'}</td>
                                            <td className="px-4 py-2.5 text-[11px] text-slate-500 max-w-[200px] truncate" title={account.description || ''}>
                                                {account.description || '-'}
                                            </td>
                                            <td className="px-4 py-2.5 text-[11px] font-bold text-slate-800 text-right">
                                                {['asset', 'equity', 'liability'].includes(account.account_type) ? (
                                                    multi_currency_enabled && account.currency_id && account.currency_id !== home_currency_id ? (
                                                        <div className="flex flex-col items-end">
                                                            <span>{account.currency_code} {parseFloat(account.fc_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                            <span className="text-[9px] text-slate-400 font-normal mt-0.5" title="Base Currency Equivalent">{company?.home_currency_prefix || ''} {parseFloat(account.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                        </div>
                                                    ) : (
                                                        `${company?.home_currency_prefix || ''} ${parseFloat(account.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                                                    )
                                                ) : (
                                                    ''
                                                )}
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <div className="flex items-center justify-center gap-1">
                                                    {['asset', 'equity', 'liability'].includes(account.account_type) ? (
                                                        <CommonButton
                                                            variant="ghost"
                                                            size="xs"
                                                            href={route('chart-of-account.history', account.id)}
                                                        >
                                                            View
                                                        </CommonButton>
                                                    ) : ['income', 'expense'].includes(account.account_type) ? (
                                                        <CommonButton
                                                            variant="ghost"
                                                            size="xs"
                                                            href={route('chart-of-account.history', account.id)}
                                                        >
                                                            Run Report
                                                        </CommonButton>
                                                    ) : (
                                                        <CommonButton
                                                            variant="ghost"
                                                            size="xs"
                                                            href={route('chart-of-account.history', account.id)}
                                                        >
                                                            Run Report
                                                        </CommonButton>
                                                    )}

                                                    <Dropdown>
                                                        <Dropdown.Trigger>
                                                            <button className="p-1 hover:bg-slate-100 rounded text-slate-500 transition-colors focus:outline-none flex items-center">
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                                </svg>
                                                            </button>
                                                        </Dropdown.Trigger>
                                                        <Dropdown.Content align={isLastItems ? 'top-right' : 'right'} width="48" contentClasses="py-1 bg-white ring-1 ring-black ring-opacity-5 rounded-md shadow-lg overflow-hidden">
                                                            <button
                                                                onClick={() => handleOpenEdit(account)}
                                                                className="block w-full px-4 py-2 text-start text-xs leading-5 text-slate-700 transition duration-150 ease-in-out hover:bg-slate-100 focus:bg-slate-100 focus:outline-none font-bold"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleOpenCreate(account)}
                                                                className="block w-full px-4 py-2 text-start text-xs leading-5 text-slate-700 transition duration-150 ease-in-out hover:bg-slate-100 focus:bg-slate-100 focus:outline-none font-bold border-t border-slate-100"
                                                            >
                                                                Add Sub-account
                                                            </button>
                                                            {!account.is_locked && (
                                                                <button
                                                                    onClick={() => handleToggleActive(account)}
                                                                    className="block w-full px-4 py-2 text-start text-xs leading-5 text-slate-700 transition duration-150 ease-in-out hover:bg-slate-100 focus:bg-slate-100 focus:outline-none font-bold border-t border-slate-100"
                                                                >
                                                                    {account.is_active ? "Make Inactive" : "Make Active"}
                                                                </button>
                                                            )}
                                                            {!account.is_system && (
                                                                <button
                                                                    onClick={() => handleToggleLock(account)}
                                                                    className="block w-full px-4 py-2 text-start text-xs leading-5 text-slate-700 transition duration-150 ease-in-out hover:bg-slate-100 focus:bg-slate-100 focus:outline-none font-bold border-t border-slate-100"
                                                                >
                                                                    {account.is_locked ? "Unlock Account" : "Lock Account"}
                                                                </button>
                                                            )}
                                                        </Dropdown.Content>
                                                    </Dropdown>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredAccounts.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-12 text-center text-[11px] text-slate-400 font-medium">
                                            No accounts found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <QuickAddAccount
                isOpen={isPanelOpen}
                onClose={() => setIsPanelOpen(false)}
                onSuccess={handleSuccess}
                account={chartOfAccounts.find(a => a.id === selectedId)}
                initialParentAccount={initialParent}
                currencies={currencies}
                multiCurrencyEnabled={multi_currency_enabled}
                homeCurrencyId={home_currency_id}
                locations={locations}
            />
        </AuthenticatedLayout>
    );
}
