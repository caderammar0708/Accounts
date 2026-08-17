import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import SearchableSelect from '@/Components/SearchableSelect';
import CommonButton from '@/Components/CommonButton';

export default function Index({ uncategorized, moved, closed, accounts, bankAccounts }) {
    const [activeTab, setActiveTab] = useState('uncategorized');
    const [filter, setFilter] = useState('all'); // 'all', 'payments', 'deposits'
    
    // File upload
    const { data: uploadData, setData: setUploadData, post: postUpload, processing: uploading, errors: uploadErrors } = useForm({
        file: null,
        bank_account_id: '',
    });

    const handleUpload = (e) => {
        e.preventDefault();
        if (!uploadData.bank_account_id) {
            alert('Please select a Bank Account before importing.');
            return;
        }
        postUpload(route('bank.upload'), {
            onSuccess: () => setUploadData('file', null),
        });
    };

    // State for categorizing
    const [selectedAccounts, setSelectedAccounts] = useState({});
    const [selectedBankAccounts, setSelectedBankAccounts] = useState({});

    const bankAccountOptions = (bankAccounts || []).map(a => ({
        value: a.id,
        label: `${a.account_code ? a.account_code + ' - ' : ''}${a.name}`
    }));

    const accountOptions = accounts.map(a => ({
        value: a.id,
        label: `${a.account_code ? a.account_code + ' - ' : ''}${a.name}`
    }));

    const handleMove = (line) => {
        const accountId = selectedAccounts[line.id];
        const bankAccountId = line.import?.bank_account_id || selectedBankAccounts[line.id];
        
        if (!accountId || !bankAccountId) {
            alert('Please select a Category Account before moving (ensure the import has a bank account).');
            return;
        }

        router.post(route('bank.move', line.id), {
            account_id: accountId,
            bank_account_id: bankAccountId
        }, { preserveScroll: true });
    };

    const handleClose = (line) => {
        router.post(route('bank.close', line.id), {}, { preserveScroll: true });
    };

    const handleDelete = (line) => {
        if (confirm('Are you sure you want to permanently delete this transaction? This action cannot be undone.')) {
            router.delete(route('bank.destroy', line.id), { preserveScroll: true });
        }
    };

    const handleReverse = (line) => {
        if (confirm('Are you sure you want to reverse this transaction? It will be moved back to uncategorized.')) {
            router.post(route('bank.reverse', line.id), {}, { preserveScroll: true });
        }
    };

    const activeLines = activeTab === 'uncategorized' ? uncategorized : activeTab === 'moved' ? moved : closed;
    const displayedLines = activeLines.filter(l => {
        if (filter === 'payments') return parseFloat(l.amount) < 0;
        if (filter === 'deposits') return parseFloat(l.amount) > 0;
        return true;
    });

    const totalPayment = activeLines.filter(l => parseFloat(l.amount) < 0).reduce((sum, l) => sum + Math.abs(parseFloat(l.amount)), 0);
    const totalDeposit = activeLines.filter(l => parseFloat(l.amount) > 0).reduce((sum, l) => sum + parseFloat(l.amount), 0);

    const formatCurrency = (val) => parseFloat(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">Bank Statements</h2>
                </div>
            }
        >
            <Head title="Bank Statements" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {uploadErrors.file && <div className="text-red-500 mb-4">{uploadErrors.file}</div>}

                    {/* IMPORT SECTION */}
                    <div className="bg-white p-6 shadow-sm sm:rounded-lg mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex-1 w-full sm:w-auto">
                            <h3 className="text-lg font-bold text-gray-800 mb-2">Import Bank Statement</h3>
                            <form onSubmit={handleUpload} className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                <div className="w-full sm:w-64">
                                    <SearchableSelect
                                        options={bankAccountOptions}
                                        value={uploadData.bank_account_id}
                                        onChange={(val) => setUploadData('bank_account_id', val)}
                                        placeholder="Select Bank Account..."
                                    />
                                </div>
                                <input 
                                    type="file" 
                                    onChange={e => setUploadData('file', e.target.files[0])} 
                                    className="border border-gray-300 rounded p-1.5 w-full sm:w-auto text-sm"
                                    accept=".csv"
                                />
                                <CommonButton 
                                    type="submit" 
                                    disabled={uploading || !uploadData.file || !uploadData.bank_account_id}
                                    variant="primary"
                                    className="whitespace-nowrap"
                                >
                                    {uploading ? 'Uploading...' : 'Import CSV'}
                                </CommonButton>
                            </form>
                        </div>
                        <div className="flex-shrink-0">
                            <CommonButton 
                                href={route('bank.template')} 
                                variant="outlined"
                            >
                                Download Template
                            </CommonButton>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        
                        <div className="border-b border-gray-200">
                            <nav className="-mb-px flex" aria-label="Tabs">
                                {['uncategorized', 'moved', 'closed'].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => { setActiveTab(tab); setFilter('all'); }}
                                            className={`${
                                                activeTab === tab
                                                    ? 'border-[#00713D] text-[#00713D]'
                                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            } w-1/3 py-4 px-1 text-center border-b-2 font-bold text-sm capitalize transition-colors`}
                                        >
                                            {tab} ({
                                                tab === 'uncategorized' ? uncategorized.length :
                                                tab === 'moved' ? moved.length :
                                                closed.length
                                            })
                                    </button>
                                ))}
                            </nav>
                        </div>

                        <div className="p-6 bg-white border-b border-gray-200">
                            
                            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                                <div className="flex bg-white rounded-md shadow-sm border border-gray-200 p-1">
                                    <button 
                                        onClick={() => setFilter('all')}
                                        className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors ${filter === 'all' ? 'bg-[#00713D] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                                    >
                                        All
                                    </button>
                                    <button 
                                        onClick={() => setFilter('payments')}
                                        className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors ${filter === 'payments' ? 'bg-red-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                                    >
                                        Payments
                                    </button>
                                    <button 
                                        onClick={() => setFilter('deposits')}
                                        className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors ${filter === 'deposits' ? 'bg-green-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                                    >
                                        Deposits
                                    </button>
                                </div>
                                <div className="flex gap-6">
                                    <div>
                                        <span className="text-xs text-gray-500 block">Total Payments</span>
                                        <span className="text-sm font-bold text-red-600">{formatCurrency(totalPayment)}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 block">Total Deposits</span>
                                        <span className="text-sm font-bold text-green-600">{formatCurrency(totalDeposit)}</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* UNCATEGORIZED TAB */}
                            {activeTab === 'uncategorized' && (
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Description</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {displayedLines.length === 0 ? (
                                            <tr><td colSpan="6" className="px-6 py-4 text-center text-xs text-gray-500">No uncategorized lines.</td></tr>
                                        ) : displayedLines.map((line) => (
                                            <tr key={line.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-2 whitespace-nowrap text-xs text-gray-700">{line.transaction_date}</td>
                                                <td className="px-6 py-2 text-xs text-gray-700">
                                                    <div className="font-medium">{line.description}</div>
                                                    <div className="text-[10px] text-gray-400 mt-0.5">{line.reference}</div>
                                                </td>
                                                <td className={`px-6 py-2 whitespace-nowrap text-xs font-bold ${line.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {line.amount > 0 ? '+' : ''}{line.amount}
                                                </td>
                                                <td className="px-6 py-2 whitespace-nowrap" style={{minWidth: '220px'}}>
                                                    <SearchableSelect
                                                        options={accountOptions}
                                                        value={selectedAccounts[line.id] || ""}
                                                        onChange={(val) => setSelectedAccounts({...selectedAccounts, [line.id]: val})}
                                                        placeholder="Select Category..."
                                                    />
                                                </td>
                                                <td className="px-6 py-2 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => handleMove(line)} className="bg-[#00713D] hover:bg-[#005a30] text-white font-bold py-1 px-3 rounded text-[11px] uppercase tracking-wide">
                                                            Move
                                                        </button>
                                                        <button onClick={() => handleClose(line)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-1 px-3 rounded text-[11px] border border-gray-300 uppercase tracking-wide">
                                                            Close
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {/* MOVED TAB */}
                            {activeTab === 'moved' && (
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Description</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Categorized To</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {displayedLines.length === 0 ? (
                                            <tr><td colSpan="5" className="px-6 py-4 text-center text-xs text-gray-500">No moved lines.</td></tr>
                                        ) : displayedLines.map((line) => (
                                            <tr key={line.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-2 whitespace-nowrap text-xs text-gray-700">{line.transaction_date}</td>
                                                <td className="px-6 py-2 text-xs text-gray-700">{line.description}</td>
                                                <td className={`px-6 py-2 whitespace-nowrap text-xs font-bold ${line.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {line.amount}
                                                </td>
                                                <td className="px-6 py-2 whitespace-nowrap text-xs font-medium text-[#00713D]">
                                                    {line.assigned_account?.name}
                                                </td>
                                                <td className="px-6 py-2 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => handleClose(line)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 font-bold py-1 px-3 rounded text-[11px] uppercase tracking-wide">
                                                            Close
                                                        </button>
                                                        <button onClick={() => handleReverse(line)} className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold py-1 px-3 rounded text-[11px] uppercase tracking-wide">
                                                            Reverse
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {/* CLOSED TAB */}
                            {activeTab === 'closed' && (
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Description</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Categorized To</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {displayedLines.length === 0 ? (
                                            <tr><td colSpan="5" className="px-6 py-4 text-center text-xs text-gray-500">No closed lines.</td></tr>
                                        ) : displayedLines.map((line) => (
                                            <tr key={line.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-2 whitespace-nowrap text-xs text-gray-700">{line.transaction_date}</td>
                                                <td className="px-6 py-2 text-xs text-gray-500">{line.description}</td>
                                                <td className="px-6 py-2 whitespace-nowrap text-xs font-bold text-gray-500">{line.amount}</td>
                                                <td className="px-6 py-2 whitespace-nowrap text-xs font-medium text-gray-500">{line.assigned_account?.name || '-'}</td>
                                                <td className="px-6 py-2 whitespace-nowrap">
                                                    <button onClick={() => handleDelete(line)} className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold py-1 px-3 rounded text-[11px] uppercase tracking-wide">
                                                        Delete Permanently
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
