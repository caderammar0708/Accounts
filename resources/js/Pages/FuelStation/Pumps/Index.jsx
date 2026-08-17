import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CommonButton from '@/Components/CommonButton';
import PumpSidePanel from './PumpSidePanel';
import StationTabs from '@/Components/StationTabs';

export default function Index({ pumps, tanks }) {
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [selectedPump, setSelectedPump] = useState(null);

    const handleOpenCreate = () => {
        setSelectedPump(null);
        setIsPanelOpen(true);
    };

    const handleEdit = (pump) => {
        setSelectedPump(pump);
        setIsPanelOpen(true);
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this pump?')) {
            router.delete(route('pumps.destroy', id), { preserveScroll: true });
        }
    };

    return (
        <AuthenticatedLayout header="Pump Setup">
            <Head title="Pump Setup" />

            <div className="py-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <StationTabs />

                <div className="flex items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Fuel Pumps</h1>
                        <p className="text-xs text-slate-500 mt-0.5">Manage your dispensing pumps and their linked nozzles.</p>
                    </div>
                    <CommonButton variant="primary" onClick={handleOpenCreate} className="px-3 py-1.5 text-xs">
                        <svg className="h-3 w-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                        Add Pump
                    </CommonButton>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200">
                                <th className="px-4 py-3 font-bold text-slate-400 uppercase tracking-widest w-1/4 text-[10px]">Pump Name</th>
                                <th className="px-4 py-3 font-bold text-slate-400 uppercase tracking-widest text-[10px]">Nozzles</th>
                                <th className="px-4 py-3 font-bold text-slate-400 uppercase tracking-widest text-right text-[10px] w-24">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {(!pumps || pumps.length === 0) ? (
                                <tr>
                                    <td colSpan="3" className="px-6 py-12 text-center text-slate-400 text-xs">
                                        No pumps added yet. Click "Add Pump" to configure your station.
                                    </td>
                                </tr>
                            ) : (
                                pumps.map(pump => (
                                    <tr key={pump.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-3 align-top">
                                            <div className="font-bold text-slate-900">{pump.name}</div>
                                            <div className="text-[10px] text-slate-500 mt-1">{pump.nozzles?.length || 0} Nozzles</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-2">
                                                {pump.nozzles && pump.nozzles.map(nozzle => (
                                                    <div key={nozzle.id} className="border border-slate-200 bg-white rounded-md px-2 py-1 flex flex-col min-w-[80px]">
                                                        <span className="font-bold text-slate-800 text-[11px]">{nozzle.name}</span>
                                                        {nozzle.tank && (
                                                            <span className="text-[10px] text-slate-500 mt-0.5">
                                                                {nozzle.tank.name}
                                                                {nozzle.tank.fuel_type && <span className="ml-1 text-primary-600 font-bold">&#8226; {nozzle.tank.fuel_type.name}</span>}
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right align-top">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(pump)} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-all">
                                                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                </button>
                                                <button onClick={() => handleDelete(pump.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all">
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

            <PumpSidePanel
                isOpen={isPanelOpen}
                onClose={() => setIsPanelOpen(false)}
                pump={selectedPump}
                tanks={tanks}
            />
        </AuthenticatedLayout>
    );
}
