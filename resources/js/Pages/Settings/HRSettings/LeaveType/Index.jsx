import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import HRSettingsLayout from '../HRSettingsLayout';
import Pagination from '@/Components/Pagination';
import DeleteConfirmationModal from '@/Components/DeleteConfirmationModal';

export default function Index({ leaveTypes, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [confirmDelete, setConfirmDelete] = useState(null);

    const applyFilters = (page = 1) => {
        router.get(
            route('settings.hr.leave-types.index'),
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
            router.delete(route('settings.hr.leave-types.destroy', confirmDelete.id), {
                onSuccess: () => {
                    setConfirmDelete(null);
                },
                preserveScroll: true,
            });
        }
    };

    return (
        <HRSettingsLayout activeTab="leave-types">
            <div className="space-y-6 pb-12">
                <div className="flex justify-end mb-4">
                    <Link
                        href={route('settings.hr.leave-types.create')}
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 focus:bg-indigo-700 active:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150"
                    >
                        + Add Leave Type
                    </Link>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h3 className="text-base font-bold text-white tracking-wide">Leave Types ({leaveTypes.total})</h3>
                            <p className="text-slate-400 text-xs mt-0.5">Manage employee leave categories and limits.</p>
                        </div>
                        <div className="w-full md:w-72">
                            <input
                                type="text"
                                placeholder="Search leave types..."
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
                                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Days/Year</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {leaveTypes.data.map((type) => (
                                    <tr key={type.id} className="hover:bg-slate-50/60 transition">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">{type.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">
                                            {type.days_per_year} days
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">
                                            {type.is_short_leave ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                    Short Leave
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                                    Standard
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            <Link 
                                                href={route('settings.hr.leave-types.edit', type.id)} 
                                                className="text-indigo-600 hover:text-indigo-900 mx-1"
                                            >
                                                Edit
                                            </Link>
                                            <button 
                                                onClick={() => setConfirmDelete(type)} 
                                                className="text-red-600 hover:text-red-900 mx-1"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {leaveTypes.data.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="text-center py-12 text-slate-400 italic text-sm">
                                            No leave types found. Use "Add Leave Type" to configure one.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    <div className="p-4 border-t border-slate-100 bg-slate-50/40">
                        <Pagination classNames="mt-0" links={leaveTypes.links} />
                    </div>
                </div>

                <DeleteConfirmationModal
                    isOpen={!!confirmDelete}
                    onClose={() => setConfirmDelete(null)}
                    onConfirm={handleDelete}
                    title="Delete Leave Type"
                    message={`Are you sure you want to delete the leave type "${confirmDelete?.name}"? This action cannot be undone.`}
                />
            </div>
        </HRSettingsLayout>
    );
}
