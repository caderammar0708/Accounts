import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import CommonButton from '@/Components/CommonButton';
import WarrantyTabs from '@/Components/WarrantyTabs';

export default function Index({ auth, warranties, filters }) {
    const { props } = usePage();
    const [search, setSearch] = useState(filters?.search || '');

    const submitSearch = (e) => {
        e.preventDefault();
        router.get(route('warranties.index'), { search, status: filters?.status || '' }, { preserveState: true, preserveScroll: true });
    };

    return (
        <AuthenticatedLayout user={auth.user} header="Warranties">
            <Head title="Warranties" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <WarrantyTabs />
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Warranties</h1>
                            <p className="text-sm text-slate-500 mt-1">Track active and claimed warranties across customers and vehicles.</p>
                        </div>
                        <Link href={route('warranties.index')}>
                            <CommonButton variant="primary">Refresh</CommonButton>
                        </Link>
                    </div>

                    <form onSubmit={submitSearch} className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by receipt, customer, or vehicle"
                            className="w-full sm:max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
                        />
                        <CommonButton type="submit" variant="primary">Search</CommonButton>
                        {filters?.search && (
                            <Link href={route('warranties.index')} preserveState preserveScroll>
                                <CommonButton variant="secondary">Clear</CommonButton>
                            </Link>
                        )}
                    </form>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Customer</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Vehicle</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Policy</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {warranties.data.length > 0 ? warranties.data.map((warranty) => (
                                        <tr key={warranty.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 py-3 text-sm text-slate-800">{warranty.customer?.display_name || 'N/A'}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{warranty.vehicle?.vehicle_no || 'Unassigned'}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{warranty.warranty_policy?.name || 'N/A'}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600 capitalize">{warranty.status}</td>
                                            <td className="px-4 py-3 text-center">
                                                <Link href={route('warranties.show', warranty.id)}>
                                                    <CommonButton variant="ghost" size="xs">View</CommonButton>
                                                </Link>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="5" className="px-4 py-8 text-center text-slate-500">No warranties found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {warranties.links && warranties.links.length > 0 && (
                        <div className="mt-4 px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-center gap-1">
                            {warranties.links.map((link, idx) => (
                                <Link
                                    key={idx}
                                    href={link.url || '#'}
                                    className={`px-3 py-1 text-xs border rounded-md transition-colors ${link.active ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'} ${!link.url ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                                    preserveState
                                    preserveScroll
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
