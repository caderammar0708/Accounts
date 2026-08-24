import React from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Show({ company, packages }) {
    const { data, setData, put, processing, errors } = useForm({
        package_id: company.package_id || '',
    });

    const handleAssignPackage = (e) => {
        e.preventDefault();
        put(route('companies.update', company.id), {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout header="Company Details">
            <Head title={`Company Details: ${company.company_name}`} />

            <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        {company.logo_url ? (
                            <img src={company.logo_url} alt="Company Logo" className="w-16 h-16 rounded-xl object-cover bg-white shadow-sm border border-slate-200" />
                        ) : (
                            <div className="w-16 h-16 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-2xl shadow-sm border border-primary-200">
                                {company.company_name.charAt(0)}
                            </div>
                        )}
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{company.company_name}</h1>
                            <p className="text-sm text-slate-500 mt-1">{company.industry || 'No Industry Specified'}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Company Details Column */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest border-b pb-4 mb-4">Contact Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Email</p>
                                    <p className="text-sm font-semibold text-slate-800">{company.company_email || 'Not Provided'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Phone</p>
                                    <p className="text-sm font-semibold text-slate-800">{company.phone || 'Not Provided'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Website</p>
                                    <p className="text-sm font-semibold text-slate-800">{company.website || 'Not Provided'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Address</p>
                                    <p className="text-sm font-semibold text-slate-800">{company.address || 'Not Provided'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest border-b pb-4 mb-4">Financial & Legal</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Legal Name</p>
                                    <p className="text-sm font-semibold text-slate-800">{company.legal_name || 'Not Provided'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tax ID</p>
                                    <p className="text-sm font-semibold text-slate-800">{company.tax_id || 'Not Provided'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Home Currency</p>
                                    <p className="text-sm font-semibold text-slate-800">{company.home_currency} ({company.home_currency_prefix})</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Business Type</p>
                                    <p className="text-sm font-semibold text-slate-800">{company.business_type || 'Not Provided'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Subscription & Package Column */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest border-b pb-4 mb-4">Active Subscription</h3>

                            {company.package ? (
                                <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 mb-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-lg font-bold text-primary-900">{company.package.name}</h4>
                                        <span className="px-2 py-1 bg-primary-100 text-primary-700 text-[10px] font-bold uppercase tracking-widest rounded-md">
                                            {company.package.billing_period}
                                        </span>
                                    </div>
                                    <p className="text-sm text-primary-800 font-semibold mb-1">Rs. {company.package.price}</p>
                                    <p className="text-xs text-primary-600 line-clamp-2">{company.package.description}</p>
                                </div>
                            ) : (
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-center">
                                    <p className="text-sm text-slate-500 font-medium">No package assigned.</p>
                                </div>
                            )}

                            <form onSubmit={handleAssignPackage}>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Assign Package</label>
                                <select
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all mb-4"
                                    value={data.package_id}
                                    onChange={e => setData('package_id', e.target.value)}
                                >
                                    <option value="">Select a Package...</option>
                                    {packages.map(pkg => (
                                        <option key={pkg.id} value={pkg.id}>{pkg.name} - ${pkg.price} /{pkg.billing_period}</option>
                                    ))}
                                </select>
                                {errors.package_id && <p className="mt-1 mb-4 text-xs text-red-600">{errors.package_id}</p>}

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-600 transition-all shadow-md shadow-green-900/10 disabled:opacity-50 uppercase tracking-widest"
                                >
                                    {processing ? 'Assigning...' : 'Update Subscription'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
