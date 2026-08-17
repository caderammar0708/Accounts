import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Index({ reconciliations }) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">Bank Reconciliations</h2>
            }
        >
            <Head title="Bank Reconciliations" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="flex justify-end mb-4">
                        <Link
                            href={route('bank-reconciliation.create')}
                            className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 active:bg-indigo-900 focus:outline-none focus:border-indigo-900 focus:ring ring-indigo-300 disabled:opacity-25 transition ease-in-out duration-150"
                        >
                            New Reconciliation
                        </Link>
                    </div>
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank Account</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statement Period</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ending Balance</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {reconciliations.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                            No bank reconciliations found. Click "New Reconciliation" to get started.
                                        </td>
                                    </tr>
                                ) : reconciliations.map((recon) => (
                                    <tr key={recon.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {recon.account?.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            Up to {recon.end_date}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                                            Rs {parseFloat(recon.ending_balance).toLocaleString('en-US', {minimumFractionDigits: 2})}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                recon.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {recon.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {recon.status === 'draft' ? (
                                                <Link href={route('bank-reconciliation.process', recon.id)} className="text-indigo-600 hover:text-indigo-900">
                                                    Resume
                                                </Link>
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
