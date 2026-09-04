import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import HRSettingsLayout from '../HRSettingsLayout';
import Pagination from '@/Components/Pagination';
import DeleteConfirmationModal from '@/Components/DeleteConfirmationModal';
import CommonButton from '@/Components/CommonButton';

export default function Index({ locations, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [confirmDelete, setConfirmDelete] = useState(null);

    const applyFilters = (page = 1) => {
        router.get(
            route('settings.hr.attendance-locations.index'),
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
            router.delete(route('settings.hr.attendance-locations.destroy', confirmDelete.id), {
                onSuccess: () => {
                    setConfirmDelete(null);
                },
                preserveScroll: true,
            });
        }
    };

    return (
        <HRSettingsLayout activeTab="attendance-location">
            <div className="space-y-6 pb-12">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* Toolbar */}
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search locations..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && applyFilters()}
                                    className="pl-9 pr-4 py-1.5 border border-slate-300 rounded-md text-[11px] w-64 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-slate-800 placeholder-slate-400"
                                />
                            </div>
                        </div>

                        <CommonButton
                            variant="primary"
                            href={route('settings.hr.attendance-locations.create')}
                        >
                            + Add Location
                        </CommonButton>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto min-h-[300px]">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Location Name</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Coordinates</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Radius</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Access</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {locations.data.map((location) => (
                                    <tr key={location.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-2.5 text-[11px] font-bold text-slate-800">{location.name}</td>
                                        <td className="px-4 py-2.5 text-[11px] text-slate-500">{location.latitude}, {location.longitude}</td>
                                        <td className="px-4 py-2.5 text-[11px] text-slate-500">{location.allowed_radius}m</td>
                                        <td className="px-4 py-2.5">
                                            {location.is_global ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary-50 text-primary border border-primary/20">
                                                    Global
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                                                    Assigned ({location.staff?.length || 0})
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2.5 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-1">
                                                <CommonButton 
                                                    variant="ghost" 
                                                    size="xs" 
                                                    href={route('settings.hr.attendance-locations.edit', location.id)}
                                                >
                                                    Edit
                                                </CommonButton>
                                                <CommonButton 
                                                    variant="ghost" 
                                                    size="xs" 
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => setConfirmDelete(location)}
                                                >
                                                    Delete
                                                </CommonButton>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {locations.data.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-12 text-center text-[11px] text-slate-400 font-medium">
                                            No locations found. Use "+ Add Location" to configure one.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {locations.links && locations.links.length > 3 && (
                        <div className="p-4 border-t border-slate-100 bg-slate-50/40">
                            <Pagination classNames="mt-0" links={locations.links} />
                        </div>
                    )}
                </div>

                <DeleteConfirmationModal
                    isOpen={!!confirmDelete}
                    onClose={() => setConfirmDelete(null)}
                    onConfirm={handleDelete}
                    title="Delete Location"
                    message={`Are you sure you want to delete the location "${confirmDelete?.name}"? This action cannot be undone.`}
                />
            </div>
        </HRSettingsLayout>
    );
}
