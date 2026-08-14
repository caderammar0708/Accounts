import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import CommonButton from '@/Components/CommonButton';
import WarrantyTabs from '@/Components/WarrantyTabs';

export default function Index({ auth, policies }) {
    const handleDelete = (policyId) => {
        if (!confirm('Delete this warranty policy?')) {
            return;
        }
        router.delete(route('warranty-policies.destroy', policyId));
    };

    return (
        <AuthenticatedLayout user={auth.user} header="Warranty Policies">
            <Head title="Warranty Policies" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <WarrantyTabs />
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Warranty Policies</h1>
                            <p className="text-sm text-slate-500 mt-1">Manage warranty terms for service and product coverage.</p>
                        </div>
                        <Link href={route('warranty-policies.create')}>
                            <CommonButton variant="primary">New Warranty Policy</CommonButton>
                        </Link>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Name</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Applies To</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Duration</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Expiry Rule</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Status</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {policies.length > 0 ? policies.map((policy) => (
                                        <tr key={policy.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 py-3 text-sm text-slate-800 font-semibold">{policy.name}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600 uppercase">{policy.applies_to}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{policy.duration_days ? `${policy.duration_days} days` : ''}{policy.duration_km ? `${policy.duration_days ? ' / ' : ''}${policy.duration_km} km` : ''}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{policy.expiry_rule.replace('_', ' ')}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex items-center justify-center rounded-full px-2 py-1 text-[10px] font-semibold ${policy.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                    {policy.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Link href={route('warranty-policies.edit', policy.id)}>
                                                        <CommonButton variant="ghost" size="xs">Edit</CommonButton>
                                                    </Link>
                                                    <CommonButton variant="danger" size="xs" onClick={() => handleDelete(policy.id)}>
                                                        Delete
                                                    </CommonButton>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="6" className="px-4 py-8 text-center text-slate-500">No warranty policies found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
