import React, { useEffect, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { usePageHeader } from '@/src/App';
import { PageProps, LeaveRequest } from '@/src/types';
import { PlusIcon } from '@/src/components/icons/Icons';
import { router as Inertia, Page } from '@inertiajs/react';
import Pagination from '@/src/components/ui/Pagination';
import moment from 'moment';

const LeaveRequestsPage: React.FC = () => {
    const { leaveRequests, filters } = usePage<Page<PageProps>>().props as any;
    const { setTitle, setActions } = usePageHeader();

    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [status, setStatus] = useState(filters?.status || '');

    useEffect(() => {
        setTitle('Leave Requests');
        setActions(
            <Link href="/leave-request/create" className="flex items-center justify-center px-8 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 rounded-lg shadow-sm transition duration-150 gap-2 active:scale-[0.98]">
                <PlusIcon className="h-4 w-4" />
                Apply for Leave
            </Link>
        );
        return () => setActions(undefined);
    }, [setTitle, setActions]);

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

    const updateStatus = (id: string, status: string) => {
        Inertia.put(`/leave-request/${id}/status`, { status }, { preserveScroll: true });
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-sm">
            
            {/* Modern Slate Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 border-b border-slate-200">
                <h3 className="text-base font-bold text-white tracking-wide">Leave Requests Registry</h3>
                <p className="text-slate-400 text-xs mt-0.5">Approve, reject, and monitor historical employee leave request details.</p>
            </div>

            {/* Advanced Search & Filtering Strip */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[240px]">
                    <input
                        type="text"
                        placeholder="Search by employee name, staff no..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium transition"
                    />
                </div>
                <div className="w-full md:w-48">
                    <select
                        value={status}
                        onChange={e => setStatus(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium transition"
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
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                            <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Type & Duration</th>
                            <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Days</th>
                            <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                        {leaveRequests.data.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-400 italic">
                                    No leave requests submitted yet. Click "Apply for Leave" to create a request.
                                </td>
                            </tr>
                        ) : (
                            leaveRequests.data.map((req: LeaveRequest) => (
                                <tr key={req.id} className="hover:bg-slate-50/50 transition">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-slate-900">{req.staff?.name ?? 'N/A'}</div>
                                        <div className="text-xs text-slate-400 mt-0.5">{req.staff?.staff_no}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-teal-600 font-bold">{req.leaveType?.name ?? 'N/A'}</div>
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
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold space-x-3">
                                        {req.status === 'Pending' && (
                                            <div className="inline-flex gap-2 justify-end w-full">
                                                <button 
                                                    onClick={() => updateStatus(req.id, 'Approved')} 
                                                    className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-xs transition"
                                                >
                                                    Approve
                                                </button>
                                                <button 
                                                    onClick={() => updateStatus(req.id, 'Rejected')} 
                                                    className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-xs transition"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="border-t border-slate-100 p-4 bg-slate-50/50">
                <Pagination
                    currentPage={leaveRequests.current_page}
                    totalPages={leaveRequests.last_page}
                    onPageChange={p => Inertia.get('/leave-request', { page: p }, { preserveState: true })}
                    totalItems={leaveRequests.total}
                    itemsPerPage={leaveRequests.per_page}
                />
            </div>
        </div>
    );
};

export default LeaveRequestsPage;
