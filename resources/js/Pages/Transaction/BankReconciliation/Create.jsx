import React, { useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link, usePage } from '@inertiajs/react';
import SearchableSelect from '@/Components/SearchableSelect';
import CommonInput from '@/Components/CommonInput';
import axios from 'axios';
import CommonButton from '@/Components/CommonButton';

export default function Create({ accounts }) {
    const { auth } = usePage().props;
    const currencyPrefix = auth?.company?.home_currency_prefix || 'LKR';

    const { data, setData, post, processing, errors, transform } = useForm({
        account_id: '',
        start_date: '',
        end_date: '',
        opening_balance: '0.00',
        ending_balance: '0.00',
    });

    const accountOptions = accounts.map(a => ({
        value: a.id,
        label: `${a.account_code ? a.account_code + ' - ' : ''}${a.name}`
    }));

    useEffect(() => {
        if (data.account_id && data.start_date) {
            axios.get(route('bank-reconciliation.opening-balance'), {
                params: { account_id: data.account_id, start_date: data.start_date }
            }).then(res => {
                setData('opening_balance', res.data.opening_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
            }).catch(err => console.error(err));
        }
    }, [data.account_id, data.start_date]);

    const handleBalanceChange = (field, e) => {
        const raw = e.target.value;
        const clean = raw.replace(/[^\d.,-]/g, '');
        setData(field, clean);
    };

    const handleBalanceBlur = (field) => {
        const num = parseFloat(String(data[field] || '').replace(/,/g, ''));
        setData(field, isNaN(num) ? '0.00' : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        transform((formValues) => ({
            ...formValues,
            opening_balance: parseFloat(String(formValues.opening_balance).replace(/,/g, '')) || 0,
            ending_balance: parseFloat(String(formValues.ending_balance).replace(/,/g, '')) || 0,
        }));
        post(route('bank-reconciliation.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">Start Bank Reconciliation</h2>
            }
        >
            <Head title="Start Bank Reconciliation" />

            <div className="py-6">
                <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-visible shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white border-b border-gray-200">
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Bank Account <span className="text-red-500">*</span>
                                    </label>
                                    <SearchableSelect
                                        options={accountOptions}
                                        value={data.account_id}
                                        onChange={(val) => setData('account_id', val)}
                                        placeholder="Select Bank Account..."
                                    />
                                    {errors.account_id && <p className="mt-1 text-sm text-red-600">{errors.account_id}</p>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <CommonInput
                                        label="Statement Start Date"
                                        type="date"
                                        name="start_date"
                                        value={data.start_date}
                                        onChange={(e) => setData('start_date', e.target.value)}
                                        error={errors.start_date}
                                        required
                                    />
                                    
                                    <CommonInput
                                        label="Statement End Date"
                                        type="date"
                                        name="end_date"
                                        value={data.end_date}
                                        onChange={(e) => setData('end_date', e.target.value)}
                                        error={errors.end_date}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <CommonInput
                                        label="Opening Balance"
                                        type="text"
                                        name="opening_balance"
                                        value={data.opening_balance}
                                        onChange={(e) => handleBalanceChange('opening_balance', e)}
                                        onFocus={(e) => e.target.select()}
                                        onBlur={() => handleBalanceBlur('opening_balance')}
                                        icon={<span className="text-[11px] font-bold text-slate-400 select-none">{currencyPrefix}</span>}
                                        inputClass="text-right font-mono"
                                        error={errors.opening_balance}
                                        helpText="Enter the opening balance from your bank statement."
                                        required
                                    />

                                    <CommonInput
                                        label="Ending Balance"
                                        type="text"
                                        name="ending_balance"
                                        value={data.ending_balance}
                                        onChange={(e) => handleBalanceChange('ending_balance', e)}
                                        onFocus={(e) => e.target.select()}
                                        onBlur={() => handleBalanceBlur('ending_balance')}
                                        icon={<span className="text-[11px] font-bold text-slate-400 select-none">{currencyPrefix}</span>}
                                        inputClass="text-right font-mono"
                                        error={errors.ending_balance}
                                        helpText="Enter the ending balance from your bank statement."
                                        required
                                    />
                                </div>

                                <div className="flex justify-start pt-6 mt-4 border-t border-gray-100">
                                    <CommonButton
                                        type="submit"
                                        disabled={processing}
                                        processing={processing}
                                        variant="primary"
                                    >
                                        Start Reconciling
                                    </CommonButton>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
