import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import CommonButton from '@/Components/CommonButton';

export default function Index({ auth, jobCards, filters }) {
    const [statusFilter, setStatusFilter] = useState(filters.status || '');

    useEffect(() => {
        if (statusFilter !== filters.status) {
            router.get(route('job-cards.index'), { status: statusFilter }, { preserveState: true, preserveScroll: true });
        }
    }, [statusFilter]);

    const statusColors = {
        'Pending': 'bg-slate-100 text-slate-800',
        'Diagnosing': 'bg-blue-100 text-blue-800',
        'Waiting for Parts': 'bg-orange-100 text-orange-800',
        'In Progress': 'bg-indigo-100 text-indigo-800',
        'Ready': 'bg-green-100 text-green-800',
        'Delivered': 'bg-emerald-100 text-emerald-800',
        'Cancelled': 'bg-red-100 text-red-800',
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this job card?')) {
            router.delete(route('job-cards.destroy', id));
        }
    };

    return (
        <AuthenticatedLayout user={auth.user} header="Job Registrations">
            <Head title="Job Registrations" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold text-slate-900">Job Registrations</h1>
                        <Link href={route('job-cards.create')}>
                            <CommonButton variant="primary">New Job Registration</CommonButton>
                        </Link>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-200 bg-slate-50 flex gap-4">
                            <select 
                                className="text-sm border-slate-300 rounded-md shadow-sm"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="">All Statuses</option>
                                <option value="Pending">Pending</option>
                                <option value="Diagnosing">Diagnosing</option>
                                <option value="Waiting for Parts">Waiting for Parts</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Ready">Ready</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>

                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Job #</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Customer / Device</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {jobCards.data.map((job) => (
                                    <tr key={job.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{job.job_card_number}</td>
                                        <td className="px-4 py-3 text-sm text-slate-600">{new Date(job.service_date).toLocaleDateString()}</td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm font-bold text-slate-800">{job.customer?.display_name}</div>
                                            <div className="text-xs text-slate-500">
                                                {job.device ? `${job.device.brand || ''} ${job.device.model || ''} (${job.device.vehicle_number || job.device.serial_number || 'N/A'})` : 'No Device'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[job.status] || 'bg-slate-100 text-slate-800'}`}>
                                                {job.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Link href={route('job-cards.show', job.id)}>
                                                    <CommonButton variant="ghost" size="xs">View</CommonButton>
                                                </Link>
                                                <Link href={route('job-cards.edit', job.id)}>
                                                    <CommonButton variant="ghost" size="xs">Edit</CommonButton>
                                                </Link>
                                                <CommonButton variant="ghost" size="xs" className="text-red-500" onClick={() => handleDelete(job.id)}>Delete</CommonButton>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {jobCards.data.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-4 py-8 text-center text-slate-500">No job registrations found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
