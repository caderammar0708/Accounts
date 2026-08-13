import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import CommonInput from '@/Components/CommonInput';
import CommonButton from '@/Components/CommonButton';

export default function ReportsIndex() {
    const [searchTerm, setSearchTerm] = useState('');
    const page = usePage();
    const displayAsButtons = page.props.auth.reports_display_as_buttons ?? true;

    const reportGroups = [
        {
            category: 'Financial Reports',
            reports: [
                { name: 'Profit and Loss (PNL)', href: route('reports.profit-loss') },
                { name: 'Balance Sheet', href: route('reports.balance-sheet') },
            ]
        },
        {
            category: 'Customers & Sales',
            reports: [
                ...(page.props.auth.vehicles_enabled ? [{ name: 'Vehicle History', href: route('reports.vehicle-history') }] : []),
                { name: 'Customer Balance Summary', href: route('reports.customer-balance') },
                { name: 'Customer Balance Details', href: route('reports.customer-balance-detail') },
                { name: 'Sales By Customer', href: route('reports.sales-by-customer') },
                { name: 'Sales By Item', href: route('reports.sales-by-item') },
            ]
        },
        {
            category: 'Suppliers & Purchases',
            reports: [
                { name: 'Supplier Balance Summary', href: route('reports.supplier-balance') },
                { name: 'Supplier Balance Details', href: route('reports.supplier-balance-detail') },
                { name: 'Purchase by Supplier', href: route('reports.purchase-by-supplier') },
                { name: 'Purchase by Item', href: route('reports.purchase-by-item') },
            ]
        },
        {
            category: 'Inventory',
            reports: [
                { name: 'Inventory Balance Summary', href: route('reports.inventory-summary') },
                { name: 'Inventory Balance Details', href: route('reports.inventory-detail-all') },
            ]
        }
    ];

    const filteredGroups = reportGroups.map(group => ({
        ...group,
        reports: group.reports.filter(report =>
            report.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })).filter(group => group.reports.length > 0);

    return (
        <AuthenticatedLayout header="Reports Center">
            <Head title="Reports Center" />

            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 font-serif tracking-tight">Reports Center</h1>
                    </div>
                    <div className="w-full md:w-80">
                        <CommonInput
                            type="text"
                            placeholder="Find report by name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            icon={
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            }
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredGroups.length === 0 ? (
                        <div className="col-span-full text-center py-12 bg-white rounded-xl border border-gray-200">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h3 className="mt-2 text-sm font-semibold text-gray-900">No reports found</h3>
                            <p className="mt-1 text-sm text-gray-500">Try adjusting your search term.</p>
                            <div className="mt-6">
                                <CommonButton onClick={() => setSearchTerm('')} type="button" variant="ghost">
                                    Clear search
                                </CommonButton>
                            </div>
                        </div>
                    ) : (
                        filteredGroups.map((group, gIdx) => (
                            <div key={gIdx} className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-full">
                                <div className="px-6 py-4 border-b border-gray-100 bg-white rounded-t-xl">
                                    <h2 className="text-lg font-bold text-gray-800">{group.category}</h2>
                                </div>
                                <div className="p-6 flex-1 flex flex-col gap-2">
                                    {group.reports.map((item, rIdx) => (
                                        displayAsButtons ? (
                                            <Link
                                                key={rIdx}
                                                href={item.href}
                                                className="block w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 text-sm font-medium text-gray-700 hover:text-primary-700 transition-all shadow-sm"
                                            >
                                                {item.name}
                                            </Link>
                                        ) : (
                                            <Link
                                                key={rIdx}
                                                href={item.href}
                                                className="text-sm font-medium text-primary-600 hover:text-primary-800 hover:underline underline-offset-2 py-1 transition-colors"
                                            >
                                                {item.name}
                                            </Link>
                                        )
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
