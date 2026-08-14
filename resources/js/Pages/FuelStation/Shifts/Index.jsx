import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StationTabs from '@/Components/StationTabs';
import CommonButton from '@/Components/CommonButton';
import dayjs from 'dayjs';
import CommonInput from '@/Components/CommonInput';

export default function Index({ activeShifts, pendingShifts = [], closedShifts, filters = {} }) {
    const [activeTab, setActiveTab] = React.useState('active');

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this shift?')) {
            router.delete(route('shifts.destroy', id));
        }
    }

    const [dateFilters, setDateFilters] = React.useState({
        start_date: filters.start_date || '',
        end_date: filters.end_date || ''
    });

    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (dateFilters.start_date !== (filters.start_date || '') || dateFilters.end_date !== (filters.end_date || '')) {
                router.get(route('shifts.index'), {
                    ...filters,
                    ...dateFilters
                }, { preserveState: true, preserveScroll: true, replace: true });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [dateFilters]);

    const handleFilterChange = (field, value) => {
        setDateFilters(prev => ({ ...prev, [field]: value }));
    };

    return (
        <AuthenticatedLayout header="Shifts">
            <Head title="Shifts" />

            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Pump Shifts</h1>
                        <p className="text-xs text-slate-500 mt-0.5">Manage operator shifts, opening/closing readings, and cash collections.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">From:</span>
                            <input
                                type="date"
                                className="border-0 p-1 text-xs text-slate-700 focus:ring-0 cursor-pointer w-[110px]"
                                value={dateFilters.start_date}
                                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                                onClick={(e) => e.target.showPicker && e.target.showPicker()}
                            />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">To:</span>
                            <input
                                type="date"
                                className="border-0 p-1 text-xs text-slate-700 focus:ring-0 cursor-pointer w-[110px]"
                                value={dateFilters.end_date}
                                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                                onClick={(e) => e.target.showPicker && e.target.showPicker()}
                            />
                        </div>
                        <Link href={route('shifts.create')}>
                            <CommonButton variant="primary" className="px-3 py-1.5 text-xs">
                                Start New Shift
                            </CommonButton>
                        </Link>
                    </div>
                </div>

                <div className="flex border-b border-slate-200 mb-6">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'active' ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                    >
                        Active Shifts ({activeShifts.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'pending' ? 'border-blue-500 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                    >
                        Pending Collections ({pendingShifts.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('closed')}
                        className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'closed' ? 'border-slate-800 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                    >
                        Closed Shifts ({closedShifts.length})
                    </button>
                </div>

                {activeTab === 'active' && (
                    <div className="mb-8">
                        {activeShifts.length === 0 ? (
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
                                <p className="text-sm text-slate-500">No active shifts. Start a new shift to begin recording sales.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {activeShifts.map(shift => (
                                    <div key={shift.id} className="bg-white rounded-xl shadow-sm border border-emerald-200 overflow-hidden relative">
                                        <div className="absolute top-0 right-0 left-0 h-1 bg-emerald-500"></div>
                                        <div className="p-5">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="font-bold text-slate-900">{shift.employee?.name || 'Unknown Operator'}</h3>
                                                    <p className="text-xs text-slate-500 mt-1">Started: {dayjs(shift.start_time).format('MMM D, YYYY h:mm A')}</p>
                                                </div>
                                                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                                                    Active
                                                </span>
                                            </div>

                                            <div className="text-xs text-slate-600 mb-4 bg-slate-50 p-2 rounded border border-slate-100">
                                                <span className="font-bold block mb-1">Assigned Nozzles:</span>
                                                <div className="flex flex-wrap gap-1">
                                                    {shift.shift_nozzles.map(sn => (
                                                        <span key={sn.id} className="bg-white border px-1.5 py-0.5 rounded shadow-sm text-[10px] font-mono">
                                                            {sn.nozzle?.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <Link href={route('shifts.edit', shift.id)} className="flex-1">
                                                    <CommonButton variant="primary" className="w-full justify-center py-2 text-xs">
                                                        Close Shift
                                                    </CommonButton>
                                                </Link>
                                                <Link href={route('shifts.edit-active', shift.id)} className="px-3 py-2 flex items-center justify-center border border-slate-200 rounded text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-colors">
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(shift.id)}
                                                    className="px-3 py-2 flex items-center justify-center border border-slate-200 rounded text-slate-400 hover:text-red-600 hover:border-red-200 transition-colors"
                                                >
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'pending' && (
                    <div className="mb-8">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-200">
                                        <th className="px-4 py-3 font-bold text-slate-400 uppercase tracking-widest text-[10px]">Operator</th>
                                        <th className="px-4 py-3 font-bold text-slate-400 uppercase tracking-widest text-[10px]">Duration</th>
                                        <th className="px-4 py-3 font-bold text-slate-400 uppercase tracking-widest text-[10px] text-right">Total Sales</th>
                                        <th className="px-4 py-3 font-bold text-slate-400 uppercase tracking-widest text-[10px] text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {pendingShifts.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-12 text-center text-slate-400">
                                                No pending collections found.
                                            </td>
                                        </tr>
                                    ) : (
                                        pendingShifts.map(shift => (
                                            <tr key={shift.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="font-bold text-slate-900">{shift.employee?.name}</div>
                                                    <div className="text-[10px] text-slate-500 mt-0.5">Ended: {dayjs(shift.end_time).format('MMM D, h:mm A')}</div>
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">
                                                    {dayjs(shift.start_time).format('MMM D, h:mm A')} - {dayjs(shift.end_time).format('h:mm A')}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono font-bold text-slate-700">
                                                    {parseFloat(shift.total_sales_value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <a href={route('shifts.export-pdf', shift.id)} target="_blank" rel="noopener noreferrer" className="p-1.5 inline-block text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all" title="Download Report">
                                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                        </a>
                                                        <Link href={route('shifts.collections.edit', shift.id)}>
                                                            <CommonButton variant="primary" className="px-4 py-1.5 text-[10px]">
                                                                Collection
                                                            </CommonButton>
                                                        </Link>
                                                        <Link href={route('shifts.edit', shift.id)}>
                                                            <CommonButton variant="ghost" className="px-3 py-1.5 text-[10px]">
                                                                Edit Readings
                                                            </CommonButton>
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'closed' && (
                    <div>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-200">
                                        <th className="px-4 py-3 font-bold text-slate-400 uppercase tracking-widest text-[10px]">Operator</th>
                                        <th className="px-4 py-3 font-bold text-slate-400 uppercase tracking-widest text-[10px]">Duration</th>
                                        <th className="px-4 py-3 font-bold text-slate-400 uppercase tracking-widest text-[10px] text-right">Total Sales</th>
                                        <th className="px-4 py-3 font-bold text-slate-400 uppercase tracking-widest text-[10px] text-right">Collected</th>
                                        <th className="px-4 py-3 font-bold text-slate-400 uppercase tracking-widest text-[10px] text-right">Discrepancy</th>
                                        <th className="px-4 py-3 font-bold text-slate-400 uppercase tracking-widest text-[10px] text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {closedShifts.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                                                No completed shifts found.
                                            </td>
                                        </tr>
                                    ) : (
                                        closedShifts.map(shift => {
                                            const collected = parseFloat(shift.total_sales_value) + parseFloat(shift.discrepancy);
                                            const isShort = parseFloat(shift.discrepancy) < 0;
                                            const isOver = parseFloat(shift.discrepancy) > 0;

                                            return (
                                                <tr key={shift.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <div className="font-bold text-slate-900">{shift.employee?.name}</div>
                                                        <div className="text-[10px] text-slate-500 mt-0.5">Closed: {dayjs(shift.end_time).format('MMM D, h:mm A')}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600">
                                                        {dayjs(shift.start_time).format('MMM D, h:mm A')} - {dayjs(shift.end_time).format('h:mm A')}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-700">
                                                        {parseFloat(shift.total_sales_value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-mono text-slate-600">
                                                        {collected.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className={`px-4 py-3 text-right font-mono font-bold ${isShort ? 'text-red-600' : (isOver ? 'text-emerald-600' : 'text-slate-400')}`}>
                                                        {parseFloat(shift.discrepancy) > 0 ? '+' : ''}{parseFloat(shift.discrepancy).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <a href={route('shifts.export-pdf', shift.id)} target="_blank" rel="noopener noreferrer" className="p-1.5 inline-block text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all" title="Download Report">
                                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                        </a>
                                                        <Link href={route('shifts.collections.edit', shift.id)} className="p-1.5 inline-block text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-all" title="View Shift Sheet">
                                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                        </Link>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
