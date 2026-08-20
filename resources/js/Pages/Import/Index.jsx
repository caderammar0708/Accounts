import React, { useState, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import SearchableSelect from '@/Components/SearchableSelect';
import CommonButton from '@/Components/CommonButton';

export default function ImportIndex({ bankAccounts = [], stats = {} }) {
    const { flash = {}, errors = {} } = usePage().props;
    const [selectedCard, setSelectedCard] = useState(null);
    const fileInputRef = useRef(null);
    const [dragOver, setDragOver] = useState(false);

    const cards = [
        {
            key: 'customers',
            title: 'Customers',
            badgeCount: stats.customers,
            description: 'Import customers with QuickBooks format: Name, Company, Address, Contact, Tax & Balance.',
            color: 'bg-[#00713D]',
            icon: (
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
            templateUrl: route('import.template', 'customers'),
            uploadRoute: route('import.customers'),
            columns: [
                { name: 'Name', required: true, desc: 'Customer name or display title' },
                { name: 'Company', required: false, desc: 'Company or business organization' },
                { name: 'Customer Type', required: false, desc: 'Customer category (e.g. Commercial, Individual)' },
                { name: 'Email', required: false, desc: 'Primary email address' },
                { name: 'Phone', required: false, desc: 'Primary telephone number' },
                { name: 'Mobile', required: false, desc: 'Mobile / cellular phone number' },
                { name: 'Fax', required: false, desc: 'Fax contact number' },
                { name: 'Website', required: false, desc: 'Company website URL' },
                { name: 'Street', required: false, desc: 'Street address / line 1' },
                { name: 'City', required: false, desc: 'City or town' },
                { name: 'Province/Region/State', required: false, desc: 'State, province, or region' },
                { name: 'Postal code', required: false, desc: 'ZIP or postal code' },
                { name: 'Country', required: false, desc: 'Country name' },
                { name: 'Opening Balance', required: false, desc: 'Initial outstanding balance (e.g. 2500.00)' },
                { name: 'Date', required: false, desc: 'Opening balance date (e.g. 2026-01-15 or 15/01/2026)' },
                { name: 'Tax Reg Number', required: false, desc: 'Tax registration number / VAT / GST / TIN' },
            ]
        },
        {
            key: 'suppliers',
            title: 'Suppliers',
            badgeCount: stats.suppliers,
            description: 'Import vendors & suppliers with QuickBooks format: Name, Company, Address, Contact, Tax & Balance.',
            color: 'bg-[#00713D]',
            icon: (
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            ),
            templateUrl: route('import.template', 'suppliers'),
            uploadRoute: route('import.suppliers'),
            columns: [
                { name: 'Name', required: true, desc: 'Supplier name or primary business title' },
                { name: 'Company', required: false, desc: 'Company or vendor organization name' },
                { name: 'Supplier Type', required: false, desc: 'Category (e.g. Distributor, Wholesale, Service)' },
                { name: 'Email', required: false, desc: 'Orders or invoices email address' },
                { name: 'Phone', required: false, desc: 'Primary contact telephone number' },
                { name: 'Mobile', required: false, desc: 'Mobile or cellular phone number' },
                { name: 'Fax', required: false, desc: 'Fax contact number' },
                { name: 'Website', required: false, desc: 'Supplier website URL' },
                { name: 'Street', required: false, desc: 'Street address / suite / building' },
                { name: 'City', required: false, desc: 'City or town' },
                { name: 'Province/Region/State', required: false, desc: 'State, province, or region' },
                { name: 'Postal code', required: false, desc: 'ZIP or postal code' },
                { name: 'Country', required: false, desc: 'Country name' },
                { name: 'Opening Balance', required: false, desc: 'Initial payable balance (e.g. 1250.00)' },
                { name: 'Date', required: false, desc: 'Opening balance date (e.g. 2026-01-15 or 15/01/2026)' },
                { name: 'Tax Reg Number', required: false, desc: 'Vendor tax registration number / VAT / GST / TIN' },
            ]
        },
        {
            key: 'employees',
            title: 'Employees',
            badgeCount: stats.employees,
            description: 'Import employee profiles, designations, departments, contact info, address & hire dates.',
            color: 'bg-[#00713D]',
            icon: (
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
            ),
            templateUrl: route('import.template', 'employees'),
            uploadRoute: route('import.employees'),
            columns: [
                { name: 'Name', required: true, desc: 'Employee full legal name' },
                { name: 'Employee ID', required: false, desc: 'Staff ID code (auto-generated if blank)' },
                { name: 'Designation', required: false, desc: 'Job role (matched to existing, created if new)' },
                { name: 'Department', required: false, desc: 'Department or division (e.g. Sales, Management)' },
                { name: 'Email', required: false, desc: 'Employee corporate or personal email' },
                { name: 'Phone', required: false, desc: 'Telephone or work phone number' },
                { name: 'Mobile', required: false, desc: 'Personal mobile / cellular phone number' },
                { name: 'Street', required: false, desc: 'Residential street address' },
                { name: 'City', required: false, desc: 'City or town' },
                { name: 'Province/Region/State', required: false, desc: 'State, province, or region' },
                { name: 'Postal code', required: false, desc: 'ZIP or postal code' },
                { name: 'Country', required: false, desc: 'Country name' },
                { name: 'Date of Joining', required: false, desc: 'Hire date (e.g. 2025-01-10 or 10/01/2025)' },
                { name: 'Employment Type', required: false, desc: 'Full Time, Part Time, Contract, Hourly, etc.' },
            ]
        },
        {
            key: 'chart-of-accounts',
            title: 'Chart of Accounts',
            badgeCount: stats.chart_of_accounts,
            description: 'Import general ledger accounts, parent:sub-account hierarchy, account types & opening balances.',
            color: 'bg-[#00713D]',
            icon: (
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            templateUrl: route('import.template', 'chart-of-accounts'),
            uploadRoute: route('import.chart-of-accounts'),
            columns: [
                { name: 'Account Name', required: true, desc: 'Account name (supports "Parent:Sub-account" syntax)' },
                { name: 'Account Type', required: true, desc: 'Bank, Accounts Receivable, Other Current Asset, Fixed Asset, Other Asset, Accounts Payable, Credit Card, Other Current Liability, Long Term Liability, Equity, Income, Cost of Goods Sold, Expense, Other Income, Other Expense' },
                { name: 'Detail Type', required: false, desc: 'Specific subtype (e.g. Cash and Cash Equivalents, Office Expenses)' },
                { name: 'Account Number', required: false, desc: 'General ledger account code (e.g. 1010, 5210)' },
                { name: 'Description', required: false, desc: 'Brief description of account usage' },
                { name: 'Opening Balance', required: false, desc: 'Initial ledger balance (e.g. 25000.00)' },
                { name: 'As of Date', required: false, desc: 'Balance date (e.g. 2026-01-01 or 01/01/2026)' },
            ]
        },
        {
            key: 'bank',
            title: 'Bank Data',
            badgeCount: stats.bank_transactions,
            description: 'Import bank statement CSV transactions to categorize payments and deposits.',
            color: 'bg-[#00713D]',
            icon: (
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                </svg>
            ),
            templateUrl: route('import.template', 'bank'),
            uploadRoute: route('import.bank'),
            isBank: true,
            columns: [
                { name: 'Date', required: true, desc: 'Transaction date (e.g. 29/01/2026 or 2026-01-29)' },
                { name: 'Description', required: true, desc: 'Statement narrative / memo / payee name' },
                { name: 'Reference No', required: false, desc: 'Check / transaction reference number' },
                { name: 'Debit', required: false, desc: 'Money out / withdrawal (fill only Debit or Credit)' },
                { name: 'Credit', required: false, desc: 'Money in / deposit (fill only Debit or Credit)' },
                { name: 'Balance', required: false, desc: 'Account statement balance after transaction' },
            ]
        },
    ];

    const { data, setData, post, processing, reset, errors: formErrors } = useForm({
        file: null,
        bank_account_id: '',
    });

    const handleCardClick = (card) => {
        setSelectedCard(card);
        reset();
    };

    const handleCloseModal = () => {
        setSelectedCard(null);
        reset();
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setData('file', e.target.files[0]);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setData('file', e.dataTransfer.files[0]);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!data.file) {
            alert('Please choose a file to upload.');
            return;
        }

        if (selectedCard?.isBank && !data.bank_account_id) {
            alert('Please select a Bank Account before importing.');
            return;
        }

        post(selectedCard.uploadRoute, {
            onSuccess: () => {
                handleCloseModal();
            },
            preserveScroll: true,
        });
    };

    const bankAccountOptions = bankAccounts.map(a => ({
        value: a.id,
        label: `${a.account_code ? a.account_code + ' - ' : ''}${a.name}`
    }));

    return (
        <AuthenticatedLayout header="Import Tools">
            <Head title="Import Tools - JBooks" />

            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {/* Header Banner */}
                <div className="mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00713D] to-[#00a859] flex items-center justify-center shadow-md shadow-green-900/10">
                            <span className="material-symbols-outlined text-white text-2xl">upload_file</span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Import Data</h1>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">Bring your existing data into JBooks with easy Excel and CSV templates</p>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                {flash.success && (
                    <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm animate-in fade-in">
                        <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{flash.success}</span>
                    </div>
                )}
                {(flash.error || errors.file || errors.error) && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm animate-in fade-in">
                        <svg className="w-4 h-4 text-red-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{flash.error || errors.file || errors.error}</span>
                    </div>
                )}

                {/* Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
                    {cards.map((card) => (
                        <div
                            key={card.key}
                            onClick={() => handleCardClick(card)}
                            className="bg-white rounded-2xl border border-slate-200 hover:border-[#00713D] shadow-sm hover:shadow-xl transition-all duration-300 p-6 flex flex-col items-center text-center cursor-pointer group relative overflow-hidden"
                        >
                            {/* Top decorative gradient bar */}
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#00713D]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            {/* Circle Icon Badge */}
                            <div className="w-20 h-20 rounded-full bg-[#00713D] flex items-center justify-center shadow-lg shadow-[#00713D]/25 mb-4 group-hover:scale-105 transition-transform duration-300">
                                {card.icon}
                            </div>

                            {/* Title */}
                            <h3 className="text-base font-bold text-slate-800 group-hover:text-[#00713D] transition-colors mb-1.5">
                                {card.title}
                            </h3>

                            {/* Description */}
                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                                {card.description}
                            </p>

                            {/* Action Button */}
                            <div className="mt-auto w-full pt-2">
                                <span className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-slate-50 group-hover:bg-[#00713D] text-slate-700 group-hover:text-white text-xs font-bold transition-all duration-200 border border-slate-200 group-hover:border-[#00713D]">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                    Import
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom Quick Help Section */}
                <div className="mt-12 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-slate-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-900">How Import Works</h4>
                            <ul className="text-xs text-slate-500 mt-2 space-y-1.5 list-disc list-inside">
                                <li>Click on any card above to open the import tool for that specific category.</li>
                                <li>Download the standardized Excel/CSV template with sample pre-filled headers and data.</li>
                                <li>Populate your existing records, save as CSV, and upload it directly.</li>
                                <li>Records will be imported and immediately available across transactions, reports, and search fields.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Import Dialog Modal */}
            <Modal show={selectedCard !== null} onClose={handleCloseModal} maxWidth="2xl">
                {selectedCard && (
                    <form onSubmit={handleSubmit} className="p-6">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#00713D] flex items-center justify-center shadow-md shadow-[#00713D]/20">
                                    <div className="scale-75 text-white">
                                        {selectedCard.icon}
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-slate-900">
                                        Import {selectedCard.title}
                                    </h2>
                                    <p className="text-xs text-slate-500 font-medium">
                                        Upload a CSV or spreadsheet file with your {selectedCard.title.toLowerCase()} records
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Step 1: Download Template */}
                        <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div>
                                <span className="text-2xs font-black text-slate-400 uppercase tracking-widest block">Step 1: Download Template</span>
                                <p className="text-xs font-bold text-slate-700 mt-0.5">Download the prepared sample format</p>
                                <p className="text-2xs text-slate-500">Includes all expected header columns and sample rows</p>
                            </div>
                            <a
                                href={selectedCard.templateUrl}
                                download
                                className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-100 text-[#00713D] border border-slate-300 font-bold text-xs rounded-xl transition-all shadow-sm shrink-0"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download CSV Template
                            </a>
                        </div>

                        {/* Bank Specific Input */}
                        {selectedCard.isBank && (
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Target Bank Account <span className="text-red-500">*</span>
                                </label>
                                <SearchableSelect
                                    placeholder="Select Bank Account..."
                                    options={bankAccountOptions}
                                    value={data.bank_account_id}
                                    onChange={(val) => setData('bank_account_id', val)}
                                    error={formErrors.bank_account_id}
                                />
                                <p className="text-2xs text-slate-400 mt-1">Select the chart of account matching this bank statement</p>
                            </div>
                        )}

                        {/* Step 2: Upload File Area */}
                        <div className="mb-6">
                            <span className="text-2xs font-black text-slate-400 uppercase tracking-widest block mb-2">Step 2: Upload Completed File</span>
                            <div
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
                                    dragOver ? 'border-[#00713D] bg-green-50/50' : 'border-slate-300 hover:border-[#00713D] hover:bg-slate-50/80 bg-white'
                                }`}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept=".csv, .txt"
                                    className="hidden"
                                />
                                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 mx-auto flex items-center justify-center mb-3">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                </div>
                                {data.file ? (
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>{data.file.name}</span>
                                        <span className="text-emerald-500 font-normal">({(data.file.size / 1024).toFixed(1)} KB)</span>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-xs font-bold text-slate-700">Click to choose file or drag & drop here</p>
                                        <p className="text-2xs text-slate-400 mt-1">Supports CSV, TXT files (up to 5MB)</p>
                                    </>
                                )}
                            </div>
                            {formErrors.file && (
                                <p className="text-xs font-bold text-red-500 mt-1 ml-1">{formErrors.file}</p>
                            )}
                        </div>

                        {/* Supported Fields Guide (Collapsible) */}
                        <div className="mb-6">
                            <details className="group border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                                <summary className="px-4 py-2.5 text-xs font-bold text-slate-700 cursor-pointer select-none flex items-center justify-between hover:bg-slate-100/50 transition-colors">
                                    <span>Expected Columns Guide ({selectedCard.columns.length} columns)</span>
                                    <svg className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </summary>
                                <div className="p-4 bg-white border-t border-slate-200 max-h-48 overflow-y-auto custom-scrollbar">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-2xs">
                                        {selectedCard.columns.map((col, idx) => (
                                            <div key={idx} className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex flex-col">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold text-slate-800">{col.name}</span>
                                                    {col.required ? (
                                                        <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.2 rounded">Required</span>
                                                    ) : (
                                                        <span className="text-[9px] text-slate-400">Optional</span>
                                                    )}
                                                </div>
                                                <span className="text-slate-500 mt-0.5">{col.desc}</span>
                                            </div>
                                        ))}
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
                                onClick={handleCloseModal}
                                disabled={processing}
                            >
                                Cancel
                            </CommonButton>
                            <CommonButton
                                type="submit"
                                variant="primary"
                                size="sm"
                                disabled={processing || !data.file}
                                className="bg-[#00713D] hover:bg-[#005a30] text-white"
                            >
                                {processing ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Importing...
                                    </span>
                                ) : (
                                    `Import ${selectedCard.title}`
                                )}
                            </CommonButton>
                        </div>
                    </form>
                )}
            </Modal>
        </AuthenticatedLayout>
    );
}
