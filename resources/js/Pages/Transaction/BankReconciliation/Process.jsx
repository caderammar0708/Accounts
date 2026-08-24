import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';

export default function Process({ reconciliation, lines }) {
    const { auth } = usePage().props;
    const currencyPrefix = auth?.company?.home_currency_prefix || 'LKR';
    const [filter, setFilter] = useState('all'); // 'all', 'payments', 'deposits'
    
    const handleToggleClear = (line) => {
        if (reconciliation.status === 'completed') return;
        
        router.post(route('bank-reconciliation.toggleClear', { 
            reconciliation: reconciliation.id, 
            line: line.id 
        }), {}, { preserveScroll: true });
    };

    const handleFinish = () => {
        if (confirm('Are you sure you want to finish this reconciliation? This cannot be undone.')) {
            router.post(route('bank-reconciliation.finish', reconciliation.id));
        }
    };

    const difference = parseFloat(reconciliation.ending_balance) - parseFloat(reconciliation.cleared_balance);
    const isBalanced = Math.abs(difference) < 0.01;

    // Separate deposits and payments for calculations
    const deposits = lines.filter(l => l.debit > 0);
    const payments = lines.filter(l => l.credit > 0);
    
    // Totals
    const totalDeposits = deposits.reduce((sum, l) => sum + parseFloat(l.debit), 0);
    const totalPayments = payments.reduce((sum, l) => sum + parseFloat(l.credit), 0);

    const formatCurrency = (val) => parseFloat(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Filtered lines for display
    const displayedLines = lines.filter(l => {
        if (filter === 'payments') return l.credit > 0;
        if (filter === 'deposits') return l.debit > 0;
        return true;
    });

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="font-semibold text-xl text-gray-800 leading-tight">Reconcile: {reconciliation.account?.name}</h2>
                        <p className="text-sm text-gray-500 mt-1">Period: Up to {reconciliation.end_date}</p>
                    </div>
                    {reconciliation.status === 'draft' && (
                        <button
                            onClick={handleFinish}
                            disabled={!isBalanced}
                            className={`font-bold py-2 px-6 rounded transition-colors ${
                                isBalanced 
                                ? 'bg-primary hover:bg-primary-600 text-white shadow-sm' 
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                            Finish Now
                        </button>
                    )}
                    {reconciliation.status === 'completed' && (
                        <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-bold">
                            Completed
                        </span>
                    )}
                </div>
            }
        >
            <Head title="Reconcile Account" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Summary Panel */}
                    <div className="bg-white p-6 shadow-sm sm:rounded-lg">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center divide-x divide-gray-100">
                            <div>
                                <p className="text-sm text-gray-500">Opening Balance</p>
                                <p className="text-lg font-bold text-gray-800 font-mono">{currencyPrefix} {formatCurrency(reconciliation.opening_balance)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Statement Ending</p>
                                <p className="text-lg font-bold text-gray-800 font-mono">{currencyPrefix} {formatCurrency(reconciliation.ending_balance)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Cleared Balance</p>
                                <p className="text-lg font-bold text-primary font-mono">{currencyPrefix} {formatCurrency(reconciliation.cleared_balance)}</p>
                            </div>
                            <div className="md:col-span-2 bg-gray-50 rounded-lg p-2 flex flex-col justify-center border border-gray-100">
                                <p className="text-sm text-gray-500 font-medium">Difference</p>
                                <p className={`text-2xl font-black font-mono ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                                    {currencyPrefix} {formatCurrency(difference)}
                                </p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100 text-center">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Payments</p>
                                <p className="text-lg font-bold text-red-600 font-mono">{currencyPrefix} {formatCurrency(totalPayments)}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Deposits</p>
                                <p className="text-lg font-bold text-green-600 font-mono">{currencyPrefix} {formatCurrency(totalDeposits)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Transactions */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center bg-gray-50 gap-4">
                            <h3 className="font-bold text-gray-700">Transactions</h3>
                            
                            <div className="flex bg-white rounded-md shadow-sm border border-gray-200 p-1">
                                <button 
                                    onClick={() => setFilter('all')}
                                    className={`px-4 py-1 text-sm rounded-md font-medium transition-colors ${filter === 'all' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                                >
                                    All
                                </button>
                                <button 
                                    onClick={() => setFilter('payments')}
                                    className={`px-4 py-1 text-sm rounded-md font-medium transition-colors ${filter === 'payments' ? 'bg-red-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                                >
                                    Payments
                                </button>
                                <button 
                                    onClick={() => setFilter('deposits')}
                                    className={`px-4 py-1 text-sm rounded-md font-medium transition-colors ${filter === 'deposits' ? 'bg-green-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                                >
                                    Deposits
                                </button>
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-white">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ref / Memo</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Clear</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {displayedLines.length === 0 ? (
                                        <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400">No transactions found for the selected filter.</td></tr>
                                    ) : displayedLines.map(line => {
                                        const isPayment = line.credit > 0;
                                        const amount = isPayment ? line.credit : line.debit;
                                        
                                        return (
                                            <tr key={line.id} className={line.is_cleared ? 'bg-indigo-50/50' : 'hover:bg-gray-50'}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">{line.journal_entry?.date}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${isPayment ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                        {isPayment ? 'Payment' : 'Deposit'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm">
                                                    <div className="font-medium">{line.journal_entry?.reference}</div>
                                                    <div className="text-xs text-gray-500 truncate max-w-[200px]">{line.description}</div>
                                                </td>
                                                <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${isPayment ? 'text-red-600' : 'text-green-600'}`}>
                                                    {isPayment ? '-' : '+'} {formatCurrency(amount)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={line.is_cleared}
                                                        onChange={() => handleToggleClear(line)}
                                                        disabled={reconciliation.status === 'completed'}
                                                        className="h-5 w-5 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer disabled:opacity-50"
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
