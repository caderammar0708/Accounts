import React, { useState, useEffect } from 'react';
import { usePageHeader } from '@/src/App';
import { router as Inertia } from '@inertiajs/react';
import moment from 'moment';

interface Props {
    shortLeaves: any[];
    prayerBreaks: any[];
}

const IndexPage: React.FC<Props> = ({ shortLeaves, prayerBreaks }) => {
    const { setTitle } = usePageHeader();
    const [activeTab, setActiveTab] = useState<'shortLeaves' | 'prayerBreaks'>('shortLeaves');

    useEffect(() => {
        setTitle('Pending Approvals');
    }, [setTitle]);

    const updateShortLeaveStatus = (id: number, status: 'Approved' | 'Rejected') => {
        if (confirm(`Are you sure you want to ${status.toLowerCase()} this short leave?`)) {
            Inertia.put(`/approvals/short-leave/${id}/status`, { status });
        }
    };

    const updatePrayerBreakStatus = (id: number, status: 'approved' | 'rejected') => {
        if (confirm(`Are you sure you want to ${status} this prayer break?`)) {
            Inertia.put(`/approvals/prayer-break/${id}/status`, { status });
        }
    };

    return (
        <div className="max-w-6xl mx-auto pb-12">
            <div className="flex space-x-1 bg-slate-200/50 p-1 rounded-lg w-fit mb-6">
                <button
                    onClick={() => setActiveTab('shortLeaves')}
                    className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'shortLeaves' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Short Leaves ({shortLeaves.length})
                </button>
                <button
                    onClick={() => setActiveTab('prayerBreaks')}
                    className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'prayerBreaks' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Prayer Breaks ({prayerBreaks.length})
                </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {activeTab === 'shortLeaves' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                                    <th className="px-6 py-4 font-bold">Staff</th>
                                    <th className="px-6 py-4 font-bold">Date & Time</th>
                                    <th className="px-6 py-4 font-bold">Reason</th>
                                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {shortLeaves.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-slate-500 text-sm">
                                            No pending short leaves.
                                        </td>
                                    </tr>
                                ) : (
                                    shortLeaves.map(leave => (
                                        <tr key={leave.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {leave.staff?.logo ? (
                                                        <img src={`/storage/${leave.staff.logo}`} className="h-8 w-8 rounded-full object-cover" />
                                                    ) : (
                                                        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                                            {leave.staff?.first_name?.charAt(0)}{leave.staff?.last_name?.charAt(0)}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="text-sm font-bold text-slate-800">{leave.staff?.first_name} {leave.staff?.last_name}</div>
                                                        <div className="text-xs text-slate-500">{leave.staff?.employee_id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-slate-800 font-medium">{moment(leave.start_date).format('ll')}</div>
                                                <div className="text-xs text-slate-500">{moment(leave.start_date).format('LT')} - {moment(leave.end_date).format('LT')}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                                                {leave.reason}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => updateShortLeaveStatus(leave.id, 'Approved')} className="px-3 py-1.5 text-xs font-bold bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 transition-colors">Approve</button>
                                                    <button onClick={() => updateShortLeaveStatus(leave.id, 'Rejected')} className="px-3 py-1.5 text-xs font-bold bg-rose-50 text-rose-600 rounded hover:bg-rose-100 transition-colors">Reject</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'prayerBreaks' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                                    <th className="px-6 py-4 font-bold">Staff</th>
                                    <th className="px-6 py-4 font-bold">Date & Time</th>
                                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {prayerBreaks.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-8 text-center text-slate-500 text-sm">
                                            No pending prayer breaks.
                                        </td>
                                    </tr>
                                ) : (
                                    prayerBreaks.map(breakReq => (
                                        <tr key={breakReq.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {breakReq.staff?.logo ? (
                                                        <img src={`/storage/${breakReq.staff.logo}`} className="h-8 w-8 rounded-full object-cover" />
                                                    ) : (
                                                        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                                            {breakReq.staff?.first_name?.charAt(0)}{breakReq.staff?.last_name?.charAt(0)}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="text-sm font-bold text-slate-800">{breakReq.staff?.first_name} {breakReq.staff?.last_name}</div>
                                                        <div className="text-xs text-slate-500">{breakReq.staff?.employee_id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-slate-800 font-medium">{moment(breakReq.date).format('ll')}</div>
                                                <div className="text-xs text-slate-500">{breakReq.start_time} - {breakReq.end_time || 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => updatePrayerBreakStatus(breakReq.id, 'approved')} className="px-3 py-1.5 text-xs font-bold bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 transition-colors">Approve</button>
                                                    <button onClick={() => updatePrayerBreakStatus(breakReq.id, 'rejected')} className="px-3 py-1.5 text-xs font-bold bg-rose-50 text-rose-600 rounded hover:bg-rose-100 transition-colors">Reject</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default IndexPage;
