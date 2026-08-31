import React, { useState, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import SearchableSelect from '@/Components/SearchableSelect';
import CommonButton from '@/Components/CommonButton';
import Modal from '@/Components/Modal';

export default function Index({ uncategorized, moved, closed, accounts, bankAccounts }) {
    const { flash = {} } = usePage().props;
    const [activeTab, setActiveTab] = useState('uncategorized');
    const [filter, setFilter] = useState('all'); // 'all', 'payments', 'deposits'
    const [showImportModal, setShowImportModal] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    // File upload
    const { data: uploadData, setData: setUploadData, post: postUpload, processing: uploading, errors: uploadErrors, reset: resetUpload } = useForm({
        file: null,
        bank_account_id: bankAccounts && bankAccounts.length > 0 ? bankAccounts[0].id : '',
    });

    const handleUpload = (e) => {
        e.preventDefault();
        if (!uploadData.bank_account_id) {
            alert('Please select a Bank Account before importing.');
            return;
        }
        if (!uploadData.file) {
            alert('Please choose a CSV file to upload.');
            return;
        }
        postUpload(route('bank.upload'), {
            onSuccess: () => {
                setShowImportModal(false);
                resetUpload();
            },
            preserveScroll: true,
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
                <h2 className="font-bold text-lg text-slate-800 tracking-tight">Bank Statements</h2>
            }
        >
            <Head title="Bank Statements" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {flash?.success && (
                        <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                <span>{flash.success}</span>
                            </div>
                        </div>
                    )}
                    {flash?.error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-red-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <span>{flash.error}</span>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end mb-4">
                        <CommonButton
                            type="button"
                            onClick={() => {
                                setShowImportModal(true);
                                if (bankAccounts && bankAccounts.length > 0 && !uploadData.bank_account_id) {
                                    setUploadData('bank_account_id', bankAccounts[0].id);
                                }
                            }}
                            variant="primary"
                            size="sm"
                            className="bg-primary hover:bg-primary-600 text-white flex items-center gap-1.5 shadow-sm"
                        >
                            <span className="material-symbols-outlined text-[18px]">upload_file</span>
                            Import Bank Statement
                        </CommonButton>
                    </div>

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">

                        <div className="border-b border-gray-200">
                            <nav className="-mb-px flex" aria-label="Tabs">
                                {['uncategorized', 'moved', 'closed'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => { setActiveTab(tab); setFilter('all'); }}
                                        className={`${activeTab === tab
                                                ? 'border-primary text-primary'
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
                                        className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors ${filter === 'all' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
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
                                                <td className="px-6 py-2 whitespace-nowrap" style={{ minWidth: '220px' }}>
                                                    <SearchableSelect
                                                        options={accountOptions}
                                                        value={selectedAccounts[line.id] || ""}
                                                        onChange={(val) => setSelectedAccounts({ ...selectedAccounts, [line.id]: val })}
                                                        placeholder="Select Category..."
                                                    />
                                                </td>
                                                <td className="px-6 py-2 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => handleMove(line)} className="bg-primary hover:bg-primary-600 text-white font-bold py-1 px-3 rounded text-[11px] uppercase tracking-wide">
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
                                                <td className="px-6 py-2 whitespace-nowrap text-xs font-medium text-primary">
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

            {/* Import Bank Statement Modal */}
            <Modal show={showImportModal} onClose={() => { setShowImportModal(false); resetUpload(); }} maxWidth="2xl">
                <form onSubmit={handleUpload} className="p-6">
                    {/* Modal Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20 text-white">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-900">
                                    Import Bank Statement
                                </h2>
                                <p className="text-xs text-slate-500 font-medium">
                                    Upload a CSV statement to import transactions into your bank account
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => { setShowImportModal(false); resetUpload(); }}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Bank Account Selection */}
                    <div className="mb-5">
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">
                            Select Target Bank Account <span className="text-red-500">*</span>
                        </label>
                        <SearchableSelect
                            options={bankAccountOptions}
                            value={uploadData.bank_account_id}
                            onChange={(val) => setUploadData('bank_account_id', val)}
                            placeholder="Choose bank account..."
                        />
                        {uploadErrors.bank_account_id && (
                            <p className="text-xs font-bold text-red-500 mt-1">{uploadErrors.bank_account_id}</p>
                        )}
                    </div>

                    {/* Step 1: Download Template */}
                    <div className="mb-5 p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                            <span className="text-2xs font-black text-slate-400 uppercase tracking-widest block">Step 1: Download Template</span>
                            <p className="text-xs font-bold text-slate-700 mt-0.5">Download the sample bank CSV template</p>
                            <p className="text-2xs text-slate-500">Includes Date, Ref Number, Debit, Credit, and Description columns</p>
                        </div>
                        <a
                            href={route('bank.template')}
                            download
                            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-100 text-primary border border-slate-300 font-bold text-xs rounded-xl transition-all shadow-sm shrink-0"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download CSV Template
                        </a>
                    </div>

                    {/* Step 2: Upload File Area */}
                    <div className="mb-5">
                        <span className="text-2xs font-black text-slate-400 uppercase tracking-widest block mb-2">Step 2: Upload Bank Statement</span>
                        <div
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={(e) => {
                                e.preventDefault();
                                setDragOver(false);
                                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                    setUploadData('file', e.dataTransfer.files[0]);
                                }
                            }}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
                                dragOver ? 'border-primary bg-green-50/50' : 'border-slate-300 hover:border-primary hover:bg-slate-50/80 bg-white'
                            }`}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setUploadData('file', e.target.files[0]);
                                    }
                                }}
                                accept=".csv, .txt"
                                className="hidden"
                            />
                            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 mx-auto flex items-center justify-center mb-3">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                            </div>
                            {uploadData.file ? (
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{uploadData.file.name}</span>
                                    <span className="text-emerald-500 font-normal">({(uploadData.file.size / 1024).toFixed(1)} KB)</span>
                                </div>
                            ) : (
                                <>
                                    <p className="text-xs font-bold text-slate-700">Click to choose CSV file or drag & drop here</p>
                                    <p className="text-2xs text-slate-400 mt-1">Supports CSV, TXT files (up to 5MB)</p>
                                </>
                            )}
                        </div>
                        {uploadErrors.file && (
                            <p className="text-xs font-bold text-red-500 mt-1 ml-1">{uploadErrors.file}</p>
                        )}
                    </div>

                    {/* Expected Columns Guide (Collapsible) */}
                    <div className="mb-6">
                        <details className="group border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                            <summary className="px-4 py-2.5 text-xs font-bold text-slate-700 cursor-pointer select-none flex items-center justify-between hover:bg-slate-100/50 transition-colors">
                                <span>Expected Columns Guide (5 columns)</span>
                                <svg className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </summary>
                            <div className="p-4 bg-white border-t border-slate-200 max-h-48 overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-2xs">
                                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex flex-col">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-slate-800">Date</span>
                                            <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.2 rounded">Required</span>
                                        </div>
                                        <span className="text-slate-500 mt-0.5">Transaction date (e.g. 29/01/2026 or 2026-01-29)</span>
                                    </div>
                                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex flex-col">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-slate-800">Ref Number</span>
                                            <span className="text-[9px] text-slate-400">Optional</span>
                                        </div>
                                        <span className="text-slate-500 mt-0.5">Cheque or transaction ID (e.g. SD49395)</span>
                                    </div>
                                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex flex-col">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-slate-800">Debit</span>
                                            <span className="text-[9px] text-slate-400">Optional</span>
                                        </div>
                                        <span className="text-slate-500 mt-0.5">Withdrawals / Payments (e.g. 150.00)</span>
                                    </div>
                                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex flex-col">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-slate-800">Credit</span>
                                            <span className="text-[9px] text-slate-400">Optional</span>
                                        </div>
                                        <span className="text-slate-500 mt-0.5">Deposits / Receipts (e.g. 25000.00)</span>
                                    </div>
                                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex flex-col sm:col-span-2">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-slate-800">Description</span>
                                            <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.2 rounded">Required</span>
                                        </div>
                                        <span className="text-slate-500 mt-0.5">Transaction narration or payment memo</span>
                                    </div>
                                </div>
                            </div>
                        </details>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                        <CommonButton
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => { setShowImportModal(false); resetUpload(); }}
                            disabled={uploading}
                        >
                            Cancel
                        </CommonButton>
                        <CommonButton
                            type="submit"
                            variant="primary"
                            size="sm"
                            disabled={uploading || !uploadData.file || !uploadData.bank_account_id}
                            className="bg-primary hover:bg-primary-600 text-white"
                        >
                            {uploading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Importing...
                                </span>
                            ) : (
                                'Import Statement'
                            )}
                        </CommonButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
