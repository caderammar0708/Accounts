import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CommonButton from '@/Components/CommonButton';
import dayjs from 'dayjs';
import SearchableSelect from '@/Components/SearchableSelect';

export default function Index({ activeShifts = [], pendingShifts = [], closedShifts = [], locations = [], filters = {} }) {
    const [activeTab, setActiveTab] = React.useState('active');

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this shift? Any unreturned stock will be restored to inventory.')) {
            router.delete(route('stock-shifts.destroy', id));
        }
    };

    const [filterState, setFilterState] = React.useState({
        location_id: filters.location_id || '',
        start_date: filters.start_date || '',
        end_date: filters.end_date || ''
    });

    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (
                filterState.location_id !== (filters.location_id || '') ||
                filterState.start_date !== (filters.start_date || '') ||
                filterState.end_date !== (filters.end_date || '')
            ) {
                router.get(route('stock-shifts.index'), {
                    ...filters,
                    ...filterState
                }, { preserveState: true, preserveScroll: true, replace: true });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [filterState]);

    const handleFilterChange = (field, value) => {
        setFilterState(prev => ({ ...prev, [field]: value }));
    };

    return (
        <AuthenticatedLayout header="Stock Shifts">
            <Head title="Stock Shifts" />

            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {/* Header section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Stock Shifts</h1>
                        <p className="text-xs text-slate-500 mt-0.5">Manage employee shifts, stock assignments (Reloads, SIMs, Cards), returns, and collections.</p>
                    </div>
                    <div className="flex items-center flex-wrap gap-3">
                        {locations.length > 0 && (
                            <div className="w-48">
                                <SearchableSelect
                                    options={[
                                        { value: '', label: 'All Branches' },
                                        ...locations.map(loc => ({ value: loc.id, label: loc.name }))
                                    ]}
                                    value={filterState.location_id}
                                    onChange={(val) => handleFilterChange('location_id', val)}
                                    placeholder="Filter Branch"
                                    size="sm"
                                />
                            </div>
                        )}

                        <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">From:</span>
                            <input
                                type="date"
                                className="border-0 p-1 text-xs text-slate-700 focus:ring-0 cursor-pointer w-[110px]"
                                value={filterState.start_date}
                                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                            />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">To:</span>
                            <input
                                type="date"
                                className="border-0 p-1 text-xs text-slate-700 focus:ring-0 cursor-pointer w-[110px]"
                                value={filterState.end_date}
                                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                            />
                        </div>

                        <Link href={route('stock-shifts.create')}>
                            <CommonButton variant="primary" className="px-3 py-1.5 text-xs bg-[#00713D] hover:bg-[#005a30] text-white">
                                + Start New Shift
                            </CommonButton>
                        </Link>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 mb-6">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'active' ? 'border-[#00713D] text-[#00713D]' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                    >
                        Active Shifts ({activeShifts.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'pending' ? 'border-amber-500 text-amber-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
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

                {/* Tab 1: Active Shifts */}
                {activeTab === 'active' && (
                    <div className="mb-8">
                        {activeShifts.length === 0 ? (
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
                                <p className="text-sm text-slate-500">No active stock shifts. Click "Start New Shift" to assign stock to an employee.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {activeShifts.map(shift => (
                                    <div key={shift.id} className="bg-white rounded-xl shadow-sm border border-emerald-200 overflow-hidden relative">
                                        <div className="absolute top-0 right-0 left-0 h-1 bg-[#00713D]"></div>
                                        <div className="p-5">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h3 className="font-bold text-slate-900">{shift.employee?.name || 'Unknown Employee'}</h3>
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        {shift.location ? <span className="font-semibold text-slate-700">{shift.location.name} • </span> : ''}
                                                        Started: {dayjs(shift.start_time).format('MMM D, YYYY h:mm A')}
                                                    </p>
                                                </div>
                                                <span className="bg-emerald-100 text-[#00713D] text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                                                    Active
                                                </span>
                                            </div>

                                            <div className="text-xs text-slate-600 mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                                <span className="font-bold block mb-1.5 text-slate-700">Assigned Stock Items:</span>
                                                <div className="flex flex-col gap-1 max-h-32 overflow-y-auto pr-1">
                                                    {shift.shift_items && shift.shift_items.map(si => (
                                                        <div key={si.id} className="flex justify-between items-center text-[11px] bg-white px-2 py-1 rounded border border-slate-200">
                                                            <span className="font-medium text-slate-800">{si.item?.name || 'Item'}</span>
                                                            <span className="font-bold text-[#00713D] font-mono">{parseFloat(si.issued_qty || 0).toLocaleString()} issued</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <Link href={route('stock-shifts.edit', shift.id)} className="flex-1">
                                                    <CommonButton variant="primary" className="w-full justify-center py-2 text-xs bg-[#00713D] hover:bg-[#005a30] text-white">
                                                        Close & Return Stock
                                                    </CommonButton>
                                                </Link>
                                                <Link href={route('stock-shifts.edit-active', shift.id)} className="px-3 py-2 flex items-center justify-center border border-slate-200 rounded text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-colors" title="Edit Active Stock">
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(shift.id)}
                                                    className="px-3 py-2 flex items-center justify-center border border-slate-200 rounded text-slate-400 hover:text-red-600 hover:border-red-200 transition-colors"
                                                    title="Delete Shift"
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

                {/* Tab 2: Pending Collections */}
                {activeTab === 'pending' && (
                    <div className="mb-8">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-200">
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Branch</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Started</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ended</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Items Sold</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Total Sales</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {pendingShifts.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center py-8 text-slate-500">
                                                No shifts pending collection.
                                            </td>
                                        </tr>
                                    ) : (
                                        pendingShifts.map(shift => (
                                            <tr key={shift.id} className="hover:bg-slate-50/50">
                                                <td className="px-4 py-3 font-semibold text-slate-700">{shift.location?.name || '-'}</td>
                                                <td className="px-4 py-3 font-bold text-slate-900">{shift.employee?.name}</td>
                                                <td className="px-4 py-3 text-slate-500">{dayjs(shift.start_time).format('MMM D, h:mm A')}</td>
                                                <td className="px-4 py-3 text-slate-500">{shift.end_time ? dayjs(shift.end_time).format('MMM D, h:mm A') : '-'}</td>
                                                <td className="px-4 py-3">
                                                    <span className="text-[11px] text-slate-600">
                                                        {shift.shift_items?.map(si => `${si.item?.name || 'Item'} (${parseFloat(si.sold_qty || 0).toLocaleString()})`).join(', ')}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold text-[#00713D] font-mono">
                                                    {parseFloat(shift.total_sales_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link href={route('stock-shifts.collections.edit', shift.id)}>
                                                            <CommonButton variant="primary" size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-[11px]">
                                                                Collect & Settle
                                                            </CommonButton>
                                                        </Link>
                                                        <Link href={route('stock-shifts.edit', shift.id)} className="p-1 text-slate-400 hover:text-blue-600" title="Edit Returned Stock">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                        </Link>
                                                        <button onClick={() => handleDelete(shift.id)} className="p-1 text-slate-400 hover:text-red-600" title="Delete Shift">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        </button>
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

                {/* Tab 3: Closed Shifts */}
                {activeTab === 'closed' && (
                    <div className="mb-8">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-200">
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Branch</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Started</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Closed</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Total Sales</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Status</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {closedShifts.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center py-8 text-slate-500">
                                                No closed shifts found.
                                            </td>
                                        </tr>
                                    ) : (
                                        closedShifts.map(shift => (
                                            <tr key={shift.id} className="hover:bg-slate-50/50">
                                                <td className="px-4 py-3 font-semibold text-slate-700">{shift.location?.name || '-'}</td>
                                                <td className="px-4 py-3 font-bold text-slate-900">{shift.employee?.name}</td>
                                                <td className="px-4 py-3 text-slate-500">{dayjs(shift.start_time).format('MMM D, YYYY h:mm A')}</td>
                                                <td className="px-4 py-3 text-slate-500">{shift.end_time ? dayjs(shift.end_time).format('MMM D, YYYY h:mm A') : '-'}</td>
                                                <td className="px-4 py-3 text-right font-bold text-slate-900 font-mono">
                                                    {parseFloat(shift.total_sales_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                        Closed
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <a href={route('stock-shifts.export-csv', shift.id)} target="_blank" rel="noreferrer" className="p-1 text-slate-400 hover:text-slate-700" title="Export CSV">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                        </a>
                                                        <Link
                                                            as="button"
                                                            method="post"
                                                            href={route('stock-shifts.reopen', shift.id)}
                                                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold transition-colors"
                                                            title="Reopen Shift"
                                                        >
                                                            Reopen
                                                        </Link>
                                                        <button onClick={() => handleDelete(shift.id)} className="p-1 text-slate-400 hover:text-red-600" title="Delete Shift">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        </button>
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
            </div>
        </AuthenticatedLayout>
    );
}
