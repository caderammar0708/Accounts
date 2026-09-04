import React, { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { PageProps, LeaveRequest } from '@/src/types';
import { PlusIcon, MagnifyingGlassIcon } from '@/src/components/icons/Icons';
import { router as Inertia, Page } from '@inertiajs/react';
import Pagination from '@/src/components/ui/Pagination';
import moment from 'moment';
import CommonButton from '@/Components/CommonButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

interface Props {
    isEmbedded?: boolean;
}

const LeaveRequestsPage: React.FC<Props> = ({ isEmbedded = false }) => {
    const { leaveRequests, filters } = usePage<Page<PageProps>>().props as any;

    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [status, setStatus] = useState(filters?.status || '');

    const applyFilters = (page = 1) => {
        Inertia.get(
            '/leave-request',
            {
                page,
                search: searchTerm || undefined,
                status: status || undefined,
            },
            {
                preserveState: true,
                replace: true,
            }
        );
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            applyFilters();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, status]);

    const updateStatus = (id: string, newStatus: string) => {
        Inertia.put(`/leave-request/${id}/status`, { status: newStatus }, { preserveScroll: true });
    };

    const content = (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Standard Card Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-sm font-bold text-slate-800 tracking-tight">Leave Requests Registry</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Approve, reject, and monitor historical employee leave request details.</p>
                </div>
                <CommonButton
                    href="/leave-request/create"
                    variant="primary"
                    size="sm"
                    className="gap-1.5"
                >
                    <PlusIcon className="h-4 w-4" />
                    Apply for Leave
                </CommonButton>
            </div>

            {/* Advanced Search & Filtering Strip */}
            <div className="p-4 border-b border-slate-100 bg-white flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[240px]">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <MagnifyingGlassIcon className="h-4 w-4" />
                    </span>
                    <input
                        type="text"
                        placeholder="Search by employee name, staff no..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-medium transition"
                    />
                </div>
                <div className="w-full md:w-48">
                    <select
                        value={status}
                        onChange={e => setStatus(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-medium transition"
                    >
                        <option value="">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                            <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Type & Duration</th>
                            <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Days</th>
                            <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                        {!leaveRequests?.data || leaveRequests.data.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-xs font-medium text-slate-400">
                                    No leave requests submitted yet. Click "Apply for Leave" to create a request.
                                </td>
                            </tr>
                        ) : (
                            leaveRequests.data.map((req: LeaveRequest) => (
                                <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-slate-900">{req.staff?.name ?? 'N/A'}</div>
                                        <div className="text-xs text-slate-400 mt-0.5">{req.staff?.staff_no}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-primary font-bold">{req.leaveType?.name ?? 'N/A'}</div>
                                        <div className="text-xs text-slate-500 mt-0.5">
                                            {moment(req.start_date).format('ll')} - {moment(req.end_date).format('ll')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-800">
                                        {Number(req.total_days)} day(s)
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col space-y-1">
                                            <span className={`px-2.5 py-1 text-xs font-bold rounded-full w-max border
                                                ${req.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                    req.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                        'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                                {req.status}
                                            </span>
                                            {(req as any).approved_by && (
                                                <div className="text-[10px] text-slate-500 font-semibold leading-tight mt-1">
                                                    <span className="text-slate-400">{req.status === 'Approved' ? 'Approved by:' : 'Rejected by:'}</span> {(req as any).approved_by}
                                                    {(req as any).approved_at && (
                                                        <span className="block text-slate-400 font-normal mt-0.5">{moment((req as any).approved_at).format('ll LT')}</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold">
                                        {req.status === 'Pending' && (
                                            <div className="inline-flex gap-2 justify-end">
                                                <CommonButton 
                                                    onClick={() => updateStatus(req.id, 'Approved')} 
                                                    variant="primary"
                                                    size="xs"
                                                >
                                                    Approve
                                                </CommonButton>
                                                <CommonButton 
                                                    onClick={() => updateStatus(req.id, 'Rejected')} 
                                                    variant="danger"
                                                    size="xs"
                                                >
                                                    Reject
                                                </CommonButton>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {leaveRequests && leaveRequests.total > 0 && (
                <div className="border-t border-slate-100 p-4 bg-slate-50/50">
                    <Pagination
                        currentPage={leaveRequests.current_page}
                        totalPages={leaveRequests.last_page}
                        onPageChange={p => Inertia.get('/leave-request', { page: p }, { preserveState: true })}
                        totalItems={leaveRequests.total}
                        itemsPerPage={leaveRequests.per_page}
                    />
                </div>
            )}
        </div>
    );

    if (isEmbedded) {
        return content;
    }

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-bold text-lg text-slate-800 tracking-tight">
                    Leave Requests
                </h2>
            }
        >
            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {content}
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default LeaveRequestsPage;

