import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import HRSettingsLayout from '../HRSettingsLayout';
import Pagination from '@/Components/Pagination';
import DeleteConfirmationModal from '@/Components/DeleteConfirmationModal';
import CommonButton from '@/Components/CommonButton';

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
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Header / Search Toolbar */}
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search leave types..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && applyFilters()}
                                    className="pl-9 pr-4 py-1.5 border border-slate-300 rounded-md text-[11px] w-64 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-slate-800 placeholder-slate-400"
                                />
                            </div>
                        </div>

                        <CommonButton
                            variant="primary"
                            href={route('settings.hr.leave-types.create')}
                        >
                            + Add Leave Type
                        </CommonButton>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto min-h-[300px]">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Name</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Days / Year</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Type</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {leaveTypes.data.map((type) => (
                                    <tr key={type.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-2.5 text-[11px] font-bold text-slate-800">{type.name}</td>
                                        <td className="px-4 py-2.5 text-[11px] text-slate-600 font-medium">
                                            {type.days_per_year} days
                                        </td>
                                        <td className="px-4 py-2.5 text-[11px]">
                                            {type.is_short_leave ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                                    Short Leave
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-50 text-primary border border-primary/20">
                                                    Standard
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2.5 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-1">
                                                <CommonButton 
                                                    variant="ghost" 
                                                    size="xs" 
                                                    href={route('settings.hr.leave-types.edit', type.id)}
                                                >
                                                    Edit
                                                </CommonButton>
                                                <CommonButton 
                                                    variant="ghost" 
                                                    size="xs" 
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => setConfirmDelete(type)}
                                                >
                                                    Delete
                                                </CommonButton>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {leaveTypes.data.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-12 text-center text-[11px] text-slate-400 font-medium">
                                            No leave types found. Use "+ Add Leave Type" to configure one.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {leaveTypes.links && leaveTypes.links.length > 3 && (
                        <div className="p-4 border-t border-slate-100 bg-slate-50/40">
                            <Pagination classNames="mt-0" links={leaveTypes.links} />
                        </div>
                    )}
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
