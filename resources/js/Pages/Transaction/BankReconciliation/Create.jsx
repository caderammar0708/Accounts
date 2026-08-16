import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import SearchableSelect from '@/Components/SearchableSelect';
import CommonInput from '@/Components/CommonInput';

export default function Create({ accounts }) {
    const { data, setData, post, processing, errors } = useForm({
        account_id: '',
        end_date: '',
        opening_balance: 0,
        ending_balance: 0,
    });

    const accountOptions = accounts.map(a => ({
        value: a.id,
        label: `${a.account_code ? a.account_code + ' - ' : ''}${a.name}`
    }));

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('bank-reconciliation.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">Start Bank Reconciliation</h2>
                    <Link
                        href={route('bank-reconciliation.index')}
                        className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors text-sm"
                    >
                        Back to List
                    </Link>
                </div>
            }
        >
            <Head title="Start Bank Reconciliation" />

            <div className="py-12">
                <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white border-b border-gray-200">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                
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

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <CommonInput
                                        label="Opening Balance"
                                        type="number"
                                        step="0.01"
                                        name="opening_balance"
                                        value={data.opening_balance}
                                        onChange={(e) => setData('opening_balance', e.target.value)}
                                        error={errors.opening_balance}
                                        helpText="Enter the opening balance from your bank statement."
                                        required
                                    />

                                    <CommonInput
                                        label="Ending Balance"
                                        type="number"
                                        step="0.01"
                                        name="ending_balance"
                                        value={data.ending_balance}
                                        onChange={(e) => setData('ending_balance', e.target.value)}
                                        error={errors.ending_balance}
                                        helpText="Enter the ending balance from your bank statement."
                                        required
                                    />
                                </div>

                                <div className="flex justify-end pt-4 border-t border-gray-100">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-[#00713D] hover:bg-[#005a30] text-white font-bold py-2 px-6 rounded transition-colors"
                                    >
                                        Start Reconciling
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
