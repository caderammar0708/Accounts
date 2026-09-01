import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import CommonButton from '@/Components/CommonButton';

export default function Index({ reconciliations }) {
    const { auth } = usePage().props;
    const currencyPrefix = auth?.company?.home_currency_prefix || 'LKR';

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">Bank Reconciliations</h2>
            }
        >
            <Head title="Bank Reconciliations" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="flex justify-end mb-4">
                        <CommonButton
                            href={route('bank-reconciliation.create')}
                            variant="primary"
                        >
                            New Reconciliation
                        </CommonButton>
                    </div>
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank Account</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statement Period</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ending Balance</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {reconciliations.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-4 py-4 text-sm text-center text-gray-500">
                                            No bank reconciliations found. Click "New Reconciliation" to get started.
                                        </td>
                                    </tr>
                                ) : reconciliations.map((recon) => (
                                    <tr key={recon.id}>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                            {recon.account?.name}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                            Up to {recon.end_date}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right font-semibold font-mono">
                                            {currencyPrefix} {parseFloat(recon.ending_balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${recon.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {recon.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                            {recon.status === 'draft' ? (
                                                <div className="flex justify-end gap-3">
                                                    <Link href={route('bank-reconciliation.process', recon.id)} className="text-primary hover:text-primary-600 font-semibold">
                                                        Resume
                                                    </Link>
                                                    <Link href={route('bank-reconciliation.destroy', recon.id)} method="delete" as="button" className="text-red-500 hover:text-red-700 font-semibold">
                                                        Delete
                                                    </Link>
                                                </div>
                                            ) : (
                                                <Link href={route('bank-reconciliation.process', recon.id)} className="text-gray-600 hover:text-gray-900">
                                                    View
                                                </Link>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
