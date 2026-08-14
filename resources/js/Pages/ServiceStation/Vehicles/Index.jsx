import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import CommonButton from '@/Components/CommonButton';

export default function Index({ vehicles = [] }) {
    const [searchTerm, setSearchTerm] = useState('');

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this vehicle? This action cannot be undone.')) {
            router.delete(route('vehicles.destroy', id));
        }
    };

    const filteredVehicles = vehicles.filter(v =>
        v.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.model?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AuthenticatedLayout
            header={<h2 className="font-bold text-lg text-slate-800 tracking-tight">Vehicles</h2>}
        >
            <Head title="Vehicles" />

            <div className="p-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <input
                                type="text"
                                placeholder="Find a vehicle"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-4 pr-4 py-1.5 border border-slate-300 rounded-md text-[11px] w-full focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                            />
                        </div>

                        <Link href={route('vehicles.create')}>
                            <CommonButton variant="primary">Register vehicle</CommonButton>
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Type</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Brand / Model</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Fuel Type</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredVehicles.map((vehicle) => (
                                    <tr key={vehicle.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-4 py-3 text-[11px] text-slate-800">{vehicle.vehicle_type}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-bold text-slate-800">{vehicle.brand}</span>
                                                <span className="text-[10px] text-slate-400">{vehicle.model}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-[11px] text-slate-600">{vehicle.fuel_type}</td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Link href={route('vehicles.edit', vehicle.id)}>
                                                    <CommonButton variant="ghost" size="xs">Edit</CommonButton>
                                                </Link>
                                                <div className="h-3 w-px bg-slate-200" />
                                                <CommonButton
                                                    variant="ghost"
                                                    size="xs"
                                                    className="text-red-500 hover:text-red-600"
                                                    onClick={() => handleDelete(vehicle.id)}
                                                >
                                                    Delete
                                                </CommonButton>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredVehicles.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-12 text-center text-[11px] text-slate-400 font-medium">
                                            No vehicles found. Click "Register vehicle" to get started.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}