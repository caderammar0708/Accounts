import React, { useState } from 'react';
import { router as Inertia } from '@inertiajs/react';
import moment from 'moment';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CommonButton from '@/Components/CommonButton';

interface Props {
    shortLeaves: any[];
    prayerBreaks: any[];
}

const IndexPage: React.FC<Props> = ({ shortLeaves = [], prayerBreaks = [] }) => {
    const [activeTab, setActiveTab] = useState<'shortLeaves' | 'prayerBreaks'>('shortLeaves');

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
        <AuthenticatedLayout
            header={
                <h2 className="font-bold text-lg text-slate-800 tracking-tight">
                    Pending Approvals
                </h2>
            }
        >
            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                    {/* Tab Navigation */}
                    <div className="border-b border-slate-200">
                        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                            <button
                                onClick={() => setActiveTab('shortLeaves')}
                                className={`whitespace-nowrap py-3 px-1 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors ${
                                    activeTab === 'shortLeaves'
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
                                }`}
                            >
                                Short Leaves ({shortLeaves.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('prayerBreaks')}
                                className={`whitespace-nowrap py-3 px-1 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors ${
                                    activeTab === 'prayerBreaks'
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
                                }`}
                            >
                                Prayer Breaks ({prayerBreaks.length})
                            </button>
                        </nav>
                    </div>

                    {/* Table Card */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-sm font-bold text-slate-800 tracking-tight">
                                {activeTab === 'shortLeaves' ? 'Pending Short Leaves' : 'Pending Prayer Breaks'}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Review and approve or reject employee {activeTab === 'shortLeaves' ? 'short leave requests' : 'prayer break requests'}.
                            </p>
                        </div>

                        {activeTab === 'shortLeaves' && (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Staff</th>
                                            <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date & Time</th>
                                            <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Reason</th>
                                            <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-100">
                                        {shortLeaves.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-xs font-medium text-slate-400">
                                                    No pending short leaves.
                                                </td>
                                            </tr>
                                        ) : (
                                            shortLeaves.map(leave => (
                                                <tr key={leave.id} className="hover:bg-slate-50/70 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            {leave.employee?.logo ? (
                                                                <img src={`/storage/${leave.employee.logo}`} className="h-8 w-8 rounded-full object-cover" />
                                                            ) : (
                                                                <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                                                    {leave.employee?.name?.charAt(0) || 'S'}
                                                                </div>
                                                            )}
                                                            <div>
                                                                <div className="text-sm font-bold text-slate-900">{leave.employee?.name}</div>
                                                                <div className="text-xs text-slate-400">{leave.employee?.employee_id}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-slate-800 font-semibold">{moment(leave.start_date).format('ll')}</div>
                                                        <div className="text-xs text-slate-500">{moment(leave.start_date).format('LT')} - {moment(leave.end_date).format('LT')}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs text-slate-600 max-w-xs truncate">
                                                        {leave.reason || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <div className="inline-flex items-center justify-end gap-2">
                                                            <CommonButton 
                                                                onClick={() => updateShortLeaveStatus(leave.id, 'Approved')} 
                                                                variant="primary"
                                                                size="xs"
                                                            >
                                                                Approve
                                                            </CommonButton>
                                                            <CommonButton 
                                                                onClick={() => updateShortLeaveStatus(leave.id, 'Rejected')} 
                                                                variant="danger"
                                                                size="xs"
                                                            >
                                                                Reject
                                                            </CommonButton>
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
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Staff</th>
                                            <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date & Time</th>
                                            <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-100">
                                        {prayerBreaks.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="px-6 py-12 text-center text-xs font-medium text-slate-400">
                                                    No pending prayer breaks.
                                                </td>
                                            </tr>
                                        ) : (
                                            prayerBreaks.map(breakReq => (
                                                <tr key={breakReq.id} className="hover:bg-slate-50/70 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            {breakReq.employee?.logo ? (
                                                                <img src={`/storage/${breakReq.employee.logo}`} className="h-8 w-8 rounded-full object-cover" />
                                                            ) : (
                                                                <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                                                    {breakReq.employee?.name?.charAt(0) || 'S'}
                                                                </div>
                                                            )}
                                                            <div>
                                                                <div className="text-sm font-bold text-slate-900">{breakReq.employee?.name}</div>
                                                                <div className="text-xs text-slate-400">{breakReq.employee?.employee_id}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-slate-800 font-semibold">{moment(breakReq.date).format('ll')}</div>
                                                        <div className="text-xs text-slate-500">{breakReq.start_time} - {breakReq.end_time || 'N/A'}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <div className="inline-flex items-center justify-end gap-2">
                                                            <CommonButton 
                                                                onClick={() => updatePrayerBreakStatus(breakReq.id, 'approved')} 
                                                                variant="primary"
                                                                size="xs"
                                                            >
                                                                Approve
                                                            </CommonButton>
                                                            <CommonButton 
                                                                onClick={() => updatePrayerBreakStatus(breakReq.id, 'rejected')} 
                                                                variant="danger"
                                                                size="xs"
                                                            >
                                                                Reject
                                                            </CommonButton>
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
            </div>
        </AuthenticatedLayout>
    );
};

export default IndexPage;

