import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CommonButton from '@/Components/CommonButton';
import TankSidePanel from './TankSidePanel';
import StationTabs from '@/Components/StationTabs';

export default function Index({ tanks, fuelTypes }) {
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [selectedTank, setSelectedTank] = useState(null);

    const handleOpenCreate = () => {
        setSelectedTank(null);
        setIsPanelOpen(true);
    };

    const handleEdit = (tank) => {
        setSelectedTank(tank);
        setIsPanelOpen(true);
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this tank?')) {
            router.delete(route('tanks.destroy', id), { preserveScroll: true });
        }
    };

    return (
        <AuthenticatedLayout header="Station Setup">
            <Head title="Station Setup" />

            <div className="py-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <StationTabs />

                <div className="flex items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Underground Tanks</h1>
                        <p className="text-xs text-slate-500 mt-0.5">Manage your fuel tanks, capacities, and low stock limits.</p>
                    </div>
                    <CommonButton variant="primary" onClick={handleOpenCreate} className="px-3 py-1.5 text-xs">
                        <svg className="h-3 w-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                        Add Tank
                    </CommonButton>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200">
                                <th className="px-4 py-3 font-bold text-slate-400 uppercase tracking-widest w-1/4 text-[10px]">Tank Name</th>
                                <th className="px-4 py-3 font-bold text-slate-400 uppercase tracking-widest w-1/4 text-[10px]">Fuel Type</th>
                                <th className="px-4 py-3 font-bold text-slate-400 uppercase tracking-widest text-right w-1/6 text-[10px]">Capacity (L)</th>
                                <th className="px-4 py-3 font-bold text-slate-400 uppercase tracking-widest text-right w-1/6 text-[10px]">Min Level (L)</th>
                                <th className="px-4 py-3 font-bold text-slate-400 uppercase tracking-widest text-right text-[10px]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {(!tanks || tanks.length === 0) ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400 text-xs">
                                        No tanks added yet. Click "Add Tank" to get started.
                                    </td>
                                </tr>
                            ) : (
                                tanks.map(tank => (
                                    <tr key={tank.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-2.5">
                                            <div className="font-bold text-slate-900">{tank.name}</div>
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <div className="text-slate-600">{tank.fuel_type ? tank.fuel_type.name : 'Unknown'}</div>
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-mono text-slate-700">
                                            {parseFloat(tank.capacity).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-mono text-slate-700">
                                            {parseFloat(tank.min_level).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-2.5 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(tank)} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-all">
                                                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                </button>
                                                <button onClick={() => handleDelete(tank.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all">
                                                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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

            <TankSidePanel
                isOpen={isPanelOpen}
                onClose={() => setIsPanelOpen(false)}
                tank={selectedTank}
                fuelTypes={fuelTypes}
            />
        </AuthenticatedLayout>
    );
}
