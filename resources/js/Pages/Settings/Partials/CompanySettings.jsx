

import React, { useState, useRef } from 'react';
import { useForm, router } from '@inertiajs/react';
import CommonInput from '@/Components/CommonInput';
import CommonButton from '@/Components/CommonButton';

export default function CompanySettings({ settings, currencies = [] }) {
    // 1. Logic for Company Info Text (Edit Mode)
    const [isEditing, setIsEditing] = useState(false);
    const infoForm = useForm({
        company_name: settings?.company_name || '',
        company_email: settings?.company_email || '',
        phone: settings?.phone || '',
        industry: settings?.industry || '',
        address: settings?.address || '',
        website: settings?.website || '',
        home_currency_prefix: settings?.home_currency_prefix || '',
    });

    const handleInfoSubmit = (e) => {
        e.preventDefault();
        infoForm.post(route('company.update'), {
            onSuccess: () => setIsEditing(false),
        });
    };

    // 2. Logic for Legal Info
    const [isEditingLegal, setIsEditingLegal] = useState(false);
    const legalForm = useForm({
        legal_name: settings?.legal_name || '',
        tax_id: settings?.tax_id || '',
        business_type: settings?.business_type || '',
        legal_address: settings?.legal_address || '',
    });

    const handleLegalSubmit = (e) => {
        e.preventDefault();
        legalForm.post(route('legal.update'), {
            onSuccess: () => setIsEditingLegal(false),
        });
    };

    const [isEditingAlerts, setIsEditingAlerts] = useState(false);
    const alertsForm = useForm({
        low_stock_to_emails: settings?.low_stock_to_emails || '',
        low_stock_cc_emails: settings?.low_stock_cc_emails || '',
        low_stock_bcc_emails: settings?.low_stock_bcc_emails || '',
    });

    const handleAlertsSubmit = (e) => {
        e.preventDefault();
        alertsForm.post(route('alerts.update'), {
            onSuccess: () => setIsEditingAlerts(false),
        });
    };
    // ------------------------------------

    const [isUploading, setIsUploading] = useState(false);
    const fileInput = useRef();

    const selectFile = () => {
        fileInput.current.click();
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setIsUploading(true);
            router.post(route('logo.upload'), {
                logo: file,
            }, {
                forceFormData: true,
                preserveScroll: true,
                onFinish: () => setIsUploading(false),
            });
        }
    };

    const [isEditingAccounting, setIsEditingAccounting] = useState(false);
const accountingForm = useForm({
    acct_method: settings?.acct_method || 'Accrual',
    fin_year_start: settings?.fin_year_start || 'January',
    tax_year_start: settings?.tax_year_start || 'Same as financial year',
    tax_form: settings?.tax_form || 'Partnership or limited liability company',
    books_lock_date: settings?.books_lock_date || '',
    books_lock_pin: '',
    current_pin: '',
});

const handleAccountingSubmit = (e) => {
    e.preventDefault();
    accountingForm.post(route('accounting.update'), {
        onSuccess: () => setIsEditingAccounting(false),
    });
};

    return (
        <div className="space-y-4">
            {/* Logo Section */}
            <div className="flex justify-center mb-6">
                <input
                    type="file"
                    ref={fileInput}
                    className="hidden"
                    onChange={handleLogoUpload}
                    accept="image/*"
                />

                <div onClick={selectFile} className="relative group cursor-pointer">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg border border-dashed border-gray-300 flex items-center justify-center overflow-hidden hover:border-green-600 transition-colors">
                        {settings?.logo_url ? (
                            <img
                                src={settings.logo_url}
                                className="w-full h-full object-contain"
                                alt="Company Logo"
                            />
                        ) : (
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        )}

                        <div className={`absolute inset-0 bg-black flex items-center justify-center transition-all ${isUploading ? 'bg-opacity-40' : 'bg-opacity-0 group-hover:bg-opacity-10'}`}>
                            {isUploading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            )}
                        </div>
                    </div>
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            selectFile();
                        }}
                        className="absolute -bottom-1 -right-1 bg-white rounded-full p-1.5 shadow-md border border-gray-200"
                    >
                        <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </div>
                </div>

            </div>

            {/* Company Info Card */}
            <div className="bg-white rounded shadow-sm border border-gray-200">
                {!isEditing ? (
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-3">
                            <div>
                                <h2 className="text-sm font-bold text-gray-800">Company info</h2>
                                <p className="text-gray-400 text-[10px]">This info may be used for billing purposes.</p>
                            </div>
                            <CommonButton variant="ghost" size="xs" onClick={() => setIsEditing(true)}>Edit</CommonButton>
                        </div>
                        <div className="space-y-3">
                            <div className="grid grid-cols-12 border-b border-gray-100 pb-2">
                                <div className="col-span-4 text-gray-500 text-xs font-bold">Name</div>
                                <div className="col-span-8 text-xs text-gray-800">{infoForm.data.company_name}</div>
                            </div>
                            <div className="grid grid-cols-12 border-b border-gray-100 pb-2">
                                <div className="col-span-4 text-gray-500 text-xs font-bold">Email</div>
                                <div className="col-span-8 text-xs text-gray-800">{infoForm.data.company_email}</div>
                            </div>
                            <div className="grid grid-cols-12 border-b border-gray-100 pb-2">
                                <div className="col-span-4 text-gray-500 text-xs font-bold">Phone</div>
                                <div className="col-span-8 text-xs text-gray-800">{infoForm.data.phone}</div>
                            </div>
                            <div className="grid grid-cols-12 border-b border-gray-100 pb-2">
                                <div className="col-span-4 text-gray-500 text-xs font-bold">Industry</div>
                                <div className="col-span-8 text-xs text-gray-800">{infoForm.data.industry}</div>
                            </div>
                            <div className="grid grid-cols-12 border-b border-gray-100 pb-2">
                                <div className="col-span-4 text-gray-500 text-xs font-bold">Address</div>
                                <div className="col-span-8 text-xs text-gray-800">{infoForm.data.address || <span className="text-gray-300 italic">None listed</span>}</div>
                            </div>
                            <div className="grid grid-cols-12 border-b border-gray-100 pb-2">
                                <div className="col-span-4 text-gray-500 text-xs font-bold">Website</div>
                                <div className="col-span-8 text-xs text-gray-800">{infoForm.data.website || <span className="text-gray-300 italic">None listed</span>}</div>
                            </div>
                            <div className="grid grid-cols-12 pb-2">
                                <div className="col-span-4 text-gray-500 text-xs font-bold">Currency Prefix</div>
                                <div className="col-span-8 text-xs text-gray-800">{infoForm.data.home_currency_prefix}</div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleInfoSubmit} className="p-6">
                        <h2 className="text-sm font-bold text-gray-800 mb-4">Edit Company info</h2>
                        <div className="space-y-3">
                            <CommonInput 
                                label="Company Name" 
                                value={infoForm.data.company_name} 
                                onChange={e => infoForm.setData('company_name', e.target.value)} 
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <CommonInput 
                                    type="email" 
                                    label="Company Email" 
                                    value={infoForm.data.company_email} 
                                    onChange={e => infoForm.setData('company_email', e.target.value)} 
                                />
                                <CommonInput 
                                    label="Phone" 
                                    value={infoForm.data.phone} 
                                    onChange={e => infoForm.setData('phone', e.target.value)} 
                                />
                            </div>
                            <CommonInput 
                                type="textarea" 
                                label="Address" 
                                value={infoForm.data.address} 
                                onChange={e => infoForm.setData('address', e.target.value)} 
                                rows="2" 
                            />
                            <CommonInput 
                                label="Website" 
                                value={infoForm.data.website} 
                                onChange={e => infoForm.setData('website', e.target.value)} 
                            />
                            <CommonInput 
                                label="Currency Prefix" 
                                value={infoForm.data.home_currency_prefix} 
                                onChange={e => infoForm.setData('home_currency_prefix', e.target.value)} 
                                placeholder="e.g. $" 
                            />
                        </div>
                        <div className="mt-6 flex justify-end gap-2 border-t border-gray-100 pt-4">
                            <CommonButton type="button" variant="secondary" onClick={() => setIsEditing(false)}>Cancel</CommonButton>
                            <CommonButton type="submit" variant="primary" processing={infoForm.processing}>Save</CommonButton>
                        </div>
                    </form>
                )}
            </div>

            {/* Accounting Section */}
           {/* Accounting Card */}
<div className="bg-white rounded shadow-sm border border-gray-200">
    {!isEditingAccounting ? (
        <div className="p-6">
            <div className="flex justify-between items-center mb-3">
                <div>
                    <h2 className="text-sm font-bold text-gray-800">Accounting</h2>
                    <p className="text-gray-400 text-[10px]">These settings affect how your books are kept.</p>
                </div>
                <CommonButton variant="ghost" size="xs" onClick={() => setIsEditingAccounting(true)}>Edit</CommonButton>
            </div>
            <div className="space-y-3">
                <div className="grid grid-cols-12 border-b border-gray-100 pb-2">
                    <div className="col-span-4 text-gray-500 text-xs font-bold">First month of financial year</div>
                    <div className="col-span-8 text-xs text-gray-800">{accountingForm.data.fin_year_start}</div>
                </div>
                <div className="grid grid-cols-12 border-b border-gray-100 pb-2">
                    <div className="col-span-4 text-gray-500 text-xs font-bold">First month of tax year</div>
                    <div className="col-span-8 text-xs text-gray-800">{accountingForm.data.tax_year_start}</div>
                </div>
                <div className="grid grid-cols-12 border-b border-gray-100 pb-2">
                    <div className="col-span-4 text-gray-500 text-xs font-bold">Accounting method</div>
                    <div className="col-span-8 text-xs text-gray-800">{accountingForm.data.acct_method}</div>
                </div>
                <div className="grid grid-cols-12 pb-2">
                    <div className="col-span-4 text-gray-500 text-xs font-bold">Close the books</div>
                    <div className="col-span-8 text-xs text-gray-800">{accountingForm.data.books_lock_date ? `Locked on or before ${accountingForm.data.books_lock_date}` : 'Off'}</div>
                </div>
            </div>
        </div>
    ) : (
        <form onSubmit={handleAccountingSubmit} className="p-6">
            <h2 className="text-sm font-bold text-gray-800 mb-4">Edit Accounting</h2>
            <div className="space-y-3">
                <CommonInput
                    type="select"
                    label="First month of financial year"
                    value={accountingForm.data.fin_year_start}
                    onChange={e => accountingForm.setData('fin_year_start', e.target.value)}
                    options={[
                        { label: 'January', value: 'January' },
                        { label: 'February', value: 'February' },
                        { label: 'March', value: 'March' },
                        { label: 'April', value: 'April' },
                        { label: 'May', value: 'May' },
                        { label: 'June', value: 'June' },
                        { label: 'July', value: 'July' },
                        { label: 'August', value: 'August' },
                        { label: 'September', value: 'September' },
                        { label: 'October', value: 'October' },
                        { label: 'November', value: 'November' },
                        { label: 'December', value: 'December' },
                    ]}
                />
                <CommonInput
                    type="select"
                    label="First month of tax year"
                    value={accountingForm.data.tax_year_start}
                    onChange={e => accountingForm.setData('tax_year_start', e.target.value)}
                    options={[
                        { label: 'Same as financial year', value: 'Same as financial year' },
                        { label: 'January', value: 'January' },
                    ]}
                />
                <CommonInput
                    type="select"
                    label="Accounting method"
                    value={accountingForm.data.acct_method}
                    onChange={e => accountingForm.setData('acct_method', e.target.value)}
                    options={[
                        { label: 'Accrual', value: 'Accrual' },
                        { label: 'Cash', value: 'Cash' },
                    ]}
                />
                <div className="pt-2 border-t border-gray-100 mt-2">
                    <label className="font-bold text-slate-600 ml-0.5 text-xs mb-1 block">Lock transactions on and before this date</label>
                    <CommonInput
                        type="date"
                        value={accountingForm.data.books_lock_date}
                        onChange={e => accountingForm.setData('books_lock_date', e.target.value)}
                        error={accountingForm.errors.books_lock_date}
                    />
                    
                    {accountingForm.data.books_lock_date && (
                        <div className="mt-2">
                            <CommonInput
                                type="password"
                                label={settings?.books_lock_pin ? "New PIN (leave blank to keep current)" : "Set 6-digit PIN"}
                                value={accountingForm.data.books_lock_pin}
                                onChange={e => accountingForm.setData('books_lock_pin', e.target.value)}
                                error={accountingForm.errors.books_lock_pin}
                                maxLength={6}
                            />
                        </div>
                    )}
                    
                    {settings?.books_lock_pin && (
                        <div className="mt-2">
                            <CommonInput
                                type="password"
                                label="Current PIN (required to change or remove lock)"
                                value={accountingForm.data.current_pin}
                                onChange={e => accountingForm.setData('current_pin', e.target.value)}
                                error={accountingForm.errors.current_pin}
                                maxLength={6}
                            />
                        </div>
                    )}
                </div>
            </div>
            <div className="mt-6 flex justify-end gap-2 border-t border-gray-100 pt-4">
                <CommonButton type="button" variant="secondary" onClick={() => setIsEditingAccounting(false)}>Cancel</CommonButton>
                <CommonButton type="submit" variant="primary" processing={accountingForm.processing}>Save</CommonButton>
            </div>
        </form>
    )}
</div>

            {/* Legal Info Card */}
            <div className="bg-white rounded shadow-sm border border-gray-200">
                {!isEditingLegal ? (
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-3">
                            <div>
                                <h2 className="text-sm font-bold text-gray-800">Legal info</h2>
                                <p className="text-gray-400 text-[10px]">This is the info your business uses for tax purposes.</p>
                            </div>
                            <CommonButton variant="ghost" size="xs" onClick={() => setIsEditingLegal(true)}>Edit</CommonButton>
                        </div>
                        <div className="space-y-3">
                            <div className="grid grid-cols-12 border-b border-gray-100 pb-2">
                                <div className="col-span-4 text-gray-500 text-xs font-bold">Legal business name</div>
                                <div className="col-span-8 text-xs text-gray-800">{legalForm.data.legal_name || infoForm.data.company_name}</div>
                            </div>
                            <div className="grid grid-cols-12 border-b border-gray-100 pb-2">
                                <div className="col-span-4 text-gray-500 text-xs font-bold">VAT/GST/TAX ID number</div>
                                <div className="col-span-8 text-xs text-gray-800">{legalForm.data.tax_id || <span className="text-gray-300 italic">None listed</span>}</div>
                            </div>
                            <div className="grid grid-cols-12 border-b border-gray-100 pb-2">
                                <div className="col-span-4 text-gray-500 text-xs font-bold">Business type</div>
                                <div className="col-span-8 text-xs text-gray-800">{legalForm.data.business_type || <span className="text-gray-300 italic">None listed</span>}</div>
                            </div>
                            <div className="grid grid-cols-12 pb-2">
                                <div className="col-span-4 text-gray-500 text-xs font-bold">Legal address</div>
                                <div className="col-span-8 text-xs text-gray-800">{legalForm.data.legal_address || <span className="text-gray-300 italic">None listed</span>}</div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleLegalSubmit} className="p-6">
                        <h2 className="text-sm font-bold text-gray-800 mb-4">Edit Legal info</h2>
                        <div className="space-y-3">
                            <CommonInput
                                label="Legal Business Name"
                                value={legalForm.data.legal_name}
                                onChange={e => legalForm.setData('legal_name', e.target.value)}
                            />
                            <CommonInput
                                label="VAT/GST/TAX ID number"
                                value={legalForm.data.tax_id}
                                onChange={e => legalForm.setData('tax_id', e.target.value)}
                            />
                            <CommonInput
                                type="select"
                                label="Business type"
                                value={legalForm.data.business_type}
                                onChange={e => legalForm.setData('business_type', e.target.value)}
                                options={[
                                    { label: 'Select type', value: '' },
                                    { label: 'Sole trader', value: 'Sole trader' },
                                    { label: 'Partnership or limited liability company', value: 'Partnership or limited liability company' },
                                    { label: 'Small business Corporation', value: 'Small business Corporation' },
                                ]}
                            />
                            <CommonInput
                                type="textarea"
                                label="Legal address"
                                value={legalForm.data.legal_address}
                                onChange={e => legalForm.setData('legal_address', e.target.value)}
                                rows="2"
                            />
                        </div>
                        <div className="mt-6 flex justify-end gap-2 border-t border-gray-100 pt-4">
                            <CommonButton type="button" variant="secondary" onClick={() => setIsEditingLegal(false)}>Cancel</CommonButton>
                            <CommonButton type="submit" variant="primary" processing={legalForm.processing}>Save</CommonButton>
                        </div>
                    </form>
                )}
            </div>

            {/* Alerts Card */}
            <div className="bg-white rounded shadow-sm border border-gray-200">
                {!isEditingAlerts ? (
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="text-sm font-bold text-gray-800">Alerts & Notifications</h2>
                            <CommonButton variant="ghost" size="xs" onClick={() => setIsEditingAlerts(true)}>Edit</CommonButton>
                        </div>
                        <div className="space-y-3">
                            <div className="grid grid-cols-12 border-b border-gray-100 pb-2">
                                <div className="col-span-4 text-gray-500 text-xs font-bold">Low Stock Alert (To)</div>
                                <div className="col-span-8 text-xs text-gray-800">{settings?.low_stock_to_emails || 'Not set'}</div>
                            </div>
                            <div className="grid grid-cols-12 border-b border-gray-100 pb-2">
                                <div className="col-span-4 text-gray-500 text-xs font-bold">Low Stock Alert (CC)</div>
                                <div className="col-span-8 text-xs text-gray-800">{settings?.low_stock_cc_emails || 'Not set'}</div>
                            </div>
                            <div className="grid grid-cols-12 pb-2">
                                <div className="col-span-4 text-gray-500 text-xs font-bold">Low Stock Alert (BCC)</div>
                                <div className="col-span-8 text-xs text-gray-800">{settings?.low_stock_bcc_emails || 'Not set'}</div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleAlertsSubmit} className="p-6">
                        <h2 className="text-sm font-bold text-gray-800 mb-4">Edit Alerts Configuration</h2>
                        <div className="space-y-3">
                            <div>
                                <CommonInput
                                    label="Low Stock Alert To Emails"
                                    value={alertsForm.data.low_stock_to_emails}
                                    onChange={e => alertsForm.setData('low_stock_to_emails', e.target.value)}
                                    placeholder="email1@example.com, email2@example.com"
                                />
                                <p className="text-[10px] text-gray-500 mt-1 ml-0.5">Separate multiple emails with commas</p>
                            </div>
                            <div>
                                <CommonInput
                                    label="Low Stock Alert CC Emails"
                                    value={alertsForm.data.low_stock_cc_emails}
                                    onChange={e => alertsForm.setData('low_stock_cc_emails', e.target.value)}
                                    placeholder="email1@example.com, email2@example.com"
                                />
                                <p className="text-[10px] text-gray-500 mt-1 ml-0.5">Separate multiple emails with commas</p>
                            </div>
                            <div>
                                <CommonInput
                                    label="Low Stock Alert BCC Emails"
                                    value={alertsForm.data.low_stock_bcc_emails}
                                    onChange={e => alertsForm.setData('low_stock_bcc_emails', e.target.value)}
                                    placeholder="email1@example.com, email2@example.com"
                                />
                                <p className="text-[10px] text-gray-500 mt-1 ml-0.5">Separate multiple emails with commas</p>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-2 border-t border-gray-100 pt-4">
                            <CommonButton type="button" variant="secondary" onClick={() => setIsEditingAlerts(false)}>Cancel</CommonButton>
                            <CommonButton type="submit" variant="primary" processing={alertsForm.processing}>Save</CommonButton>
                        </div>
                    </form>
                )}
            </div>

            {/* Layout Settings Card */}
            <div className="bg-white rounded shadow-sm border border-gray-200">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-3">
                        <div>
                            <h2 className="text-sm font-bold text-gray-800">Layout settings</h2>
                            <p className="text-gray-400 text-[10px]">Customize the layout of your application.</p>
                        </div>
                    </div>
                    <div className="space-y-3 pt-3">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-xs font-bold text-gray-800">POS Layout</h3>
                                <p className="text-gray-400 text-[10px]">If enabled, only POS Billing will be shown in the sidebar and navbar.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer scale-90">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={settings?.pos_layout_enabled || false}
                                    onChange={(e) => {
                                        router.post(route('layout.update'), {
                                            pos_layout_enabled: e.target.checked
                                        }, { preserveScroll: true });
                                    }}
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                        </div>
                    </div>

                    <div className="space-y-3 pt-3">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-xs font-bold text-gray-800">Warranty</h3>
                                <p className="text-gray-400 text-[10px]">If enabled, only warranty will be shown in the sidebar and navbar.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer scale-90">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={settings?.warranty_layout_enabled || false}
                                    onChange={(e) => {
                                        router.post(route('layout.warranty.update'), {
                                            warranty_layout_enabled: e.target.checked
                                        }, { preserveScroll: true });
                                    }}
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                        </div>
                    </div>

                    <div className="space-y-3 pt-3">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-xs font-bold text-gray-800">Job Registration</h3>
                                <p className="text-gray-400 text-[10px]">If enabled, only job registration will be shown in the sidebar and navbar.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer scale-90">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={settings?.job_layout_enabled || false}
                                    onChange={(e) => {
                                        router.post(route('layout.job.update'), {
                                            job_layout_enabled: e.target.checked
                                        }, { preserveScroll: true });
                                    }}
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                        </div>
                    </div>

                    <div className="space-y-3 pt-3">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-xs font-bold text-gray-800">Customer Modal Mode</h3>
                                <p className="text-gray-400 text-[10px]">If disabled, Customer opens as a modal instead of a full page.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer scale-90">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={settings?.customer_layout_modal || false}
                                    onChange={(e) => {
                                        router.post(route('layout.customer.update'), {
                                            customer_layout_modal: e.target.checked
                                        }, { preserveScroll: true });
                                    }}
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                        </div>
                    </div>

                    <div className="space-y-3 pt-3">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-xs font-bold text-gray-800">Reports & Quick Action Style</h3>
                                <p className="text-gray-400 text-[10px]">If enabled, Reports Center and Quick Action Menu items are shown as buttons; otherwise shown as links.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer scale-90">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={settings?.reports_display_as_buttons ?? true}
                                    onChange={(e) => {
                                        router.post(route('layout.reports.update'), {
                                            reports_display_as_buttons: e.target.checked
                                        }, { preserveScroll: true });
                                    }}
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                        </div>
                    </div>

                    <div className="space-y-3 pt-3">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-xs font-bold text-gray-800">Vehicles</h3>
                                <p className="text-gray-400 text-[10px]">If enabled, Vehicles will be shown in the sidebar, Reports Center, and POS.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer scale-90">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={settings?.vehicles_enabled ?? true}
                                    onChange={(e) => {
                                        router.post(route('layout.vehicles.update'), {
                                            vehicles_enabled: e.target.checked
                                        }, { preserveScroll: true });
                                    }}
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
