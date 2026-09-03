import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import HRSettingsLayout from '../HRSettingsLayout';
import Pagination from '@/Components/Pagination';
import DeleteConfirmationModal from '@/Components/DeleteConfirmationModal';

export default function Index({ shifts, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [confirmDelete, setConfirmDelete] = useState(null);

    const applyFilters = (page = 1) => {
        router.get(
            route('settings.hr.shifts.index'),
            {
                page,
                search: searchTerm || undefined,
            },
            {
                preserveState: true,
                replace: true,
            }
        );
    };

    const handleDelete = () => {
        if (confirmDelete) {
            router.delete(route('settings.hr.shifts.destroy', confirmDelete.id), {
                onSuccess: () => {
                    setConfirmDelete(null);
                },
                preserveScroll: true,
            });
        }
    };

    return (
        <HRSettingsLayout activeTab="shift">
            <div className="space-y-6 pb-12">
                <div className="flex justify-end mb-4">
                    <Link
                        href={route('settings.hr.shifts.create')}
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 focus:bg-indigo-700 active:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150"
                    >
                        + Add Shift
                    </Link>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h3 className="text-base font-bold text-white tracking-wide">Work Shifts ({shifts.total})</h3>
                            <p className="text-slate-400 text-xs mt-0.5">Manage employee work schedules and hours.</p>
                        </div>
                        <div className="w-full md:w-72">
                            <input
                                type="text"
                                placeholder="Search shifts..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && applyFilters()}
                                className="w-full px-3.5 py-2 bg-slate-800/40 border border-slate-700/60 rounded-lg text-xs font-semibold text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Shift Name</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Timing</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Half-day Timing</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Working Days</th>
                                    <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {shifts.data.map((shift) => (
                                    <tr key={shift.id} className="hover:bg-slate-50/60 transition">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">{shift.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">
                                            {shift.start_time ? `${shift.start_time.substring(0, 5)} - ${shift.end_time.substring(0, 5)}` : 'Flexible'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">
                                            {shift.half_day_start_time ? `${shift.half_day_start_time.substring(0, 5)} - ${shift.half_day_end_time.substring(0, 5)}` : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">
                                            {shift.working_days && shift.working_days.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {shift.working_days.map(day => (
                                                        <span key={day} className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs">
                                                            {day.substring(0, 3)}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : 'All Days'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            <Link 
                                                href={route('settings.hr.shifts.edit', shift.id)} 
                                                className="text-indigo-600 hover:text-indigo-900 mx-1"
                                            >
                                                Edit
                                            </Link>
                                            <button 
                                                onClick={() => setConfirmDelete(shift)} 
                                                className="text-red-600 hover:text-red-900 mx-1"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {shifts.data.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="text-center py-12 text-slate-400 italic text-sm">
                                            No shifts found. Use "Add Shift" to configure one.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    <div className="p-4 border-t border-slate-100 bg-slate-50/40">
                        <Pagination classNames="mt-0" links={shifts.links} />
                    </div>
                </div>

                <DeleteConfirmationModal
                    isOpen={!!confirmDelete}
                    onClose={() => setConfirmDelete(null)}
                    onConfirm={handleDelete}
                    title="Delete Shift"
                    message={`Are you sure you want to delete the shift "${confirmDelete?.name}"? This action cannot be undone.`}
                />
            </div>
        </HRSettingsLayout>
    );
}
