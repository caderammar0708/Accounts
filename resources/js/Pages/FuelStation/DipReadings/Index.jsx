import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import CommonInput from '@/Components/CommonInput';
import SlideOver from '@/Components/SlideOver';
import CommonButton from '@/Components/CommonButton';
import StationTabs from '@/Components/StationTabs';

export default function Index({ auth, dipReadings, tanks, filters }) {
    const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
    
    const { data, setData, post, processing, errors, reset } = useForm({
        tank_id: '',
        date: new Date().toISOString().split('T')[0],
        physical_dip: '',
        notes: '',
    });

    const selectedTank = tanks.find(t => t.id == data.tank_id);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('tank-dip-readings.store'), {
            onSuccess: () => {
                setIsSlideOverOpen(false);
                reset();
            }
        });
    };

    const handleFilterChange = (e) => {
        router.get(route('tank-dip-readings.index'), { tank_id: e.target.value }, { preserveState: true, replace: true });
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this dip reading?')) {
            router.delete(route('tank-dip-readings.destroy', id));
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Tank Dip Readings</h2>}
        >
            <Head title="Tank Dip Readings" />

            <div className="py-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <StationTabs />
                
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex gap-4 items-center">
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                        Tank Reconciliations
                                    </h3>
                                    
                                    <select 
                                        className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm text-sm"
                                        value={filters?.tank_id || ''}
                                        onChange={handleFilterChange}
                                    >
                                        <option value="">All Tanks</option>
                                        {tanks.map(tank => (
                                            <option key={tank.id} value={tank.id}>{tank.name}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <button
                                    onClick={() => setIsSlideOverOpen(true)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                    New Dip Reading
                                </button>
                            </div>

                            <div className="overflow-x-auto border rounded-xl">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tank</th>
                                            <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Book Stock</th>
                                            <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Physical Dip</th>
                                            <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Variance</th>
                                            <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Recorded By</th>
                                            <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {dipReadings.data.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                                                    <p>No dip readings recorded yet.</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            dipReadings.data.map((reading) => (
                                                <tr key={reading.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                                                        <div className="flex items-center gap-2">
                                                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                            {reading.date}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                                        {reading.tank?.name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 text-right">
                                                        {parseFloat(reading.book_stock).toLocaleString()} L
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 text-right">
                                                        {parseFloat(reading.physical_dip).toLocaleString()} L
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right">
                                                        <span className={reading.variance < 0 ? 'text-red-600' : (reading.variance > 0 ? 'text-green-600' : 'text-slate-500')}>
                                                            {reading.variance > 0 ? '+' : ''}{parseFloat(reading.variance).toLocaleString()} L
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-center">
                                                        {reading.creator?.name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                                        <button 
                                                            onClick={() => handleDelete(reading.id)}
                                                            className="text-red-500 hover:text-red-700 font-medium text-xs"
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

            <SlideOver 
                title="New Dip Reading" 
                isOpen={isSlideOverOpen} 
                setIsOpen={setIsSlideOverOpen}
                size="md"
            >
                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Select Tank *</label>
                                <select
                                    className="w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                    value={data.tank_id}
                                    onChange={(e) => setData('tank_id', e.target.value)}
                                    required
                                >
                                    <option value="">-- Choose Tank --</option>
                                    {tanks.map(tank => (
                                        <option key={tank.id} value={tank.id}>{tank.name}</option>
                                    ))}
                                </select>
                                {errors.tank_id && <div className="text-red-500 text-xs mt-1">{errors.tank_id}</div>}
                            </div>
                            
                            <CommonInput
                                label="Date *"
                                type="date"
                                value={data.date}
                                onChange={(e) => setData('date', e.target.value)}
                                error={errors.date}
                                required
                            />

                            {selectedTank && (
                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-slate-500">Current Book Stock:</span>
                                        <span className="font-bold text-slate-800">{parseFloat(selectedTank.current_stock).toLocaleString()} L</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Tank Capacity:</span>
                                        <span className="text-slate-800">{parseFloat(selectedTank.capacity).toLocaleString()} L</span>
                                    </div>
                                </div>
                            )}

                            <CommonInput
                                label="Physical Dip Reading (Liters) *"
                                type="number"
                                step="0.01"
                                min="0"
                                max={selectedTank?.capacity}
                                value={data.physical_dip}
                                onChange={(e) => setData('physical_dip', e.target.value)}
                                error={errors.physical_dip}
                                required
                            />
                            
                            {data.physical_dip && selectedTank && (
                                <div className={`p-3 rounded-md text-sm font-medium border ${parseFloat(data.physical_dip) - parseFloat(selectedTank.current_stock) < 0 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                                    Expected Variance: {(parseFloat(data.physical_dip) - parseFloat(selectedTank.current_stock)).toFixed(2)} L
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
                                <textarea
                                    className="w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                    rows="3"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                ></textarea>
                                {errors.notes && <div className="text-red-500 text-xs mt-1">{errors.notes}</div>}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t">
                            <button
                                type="button"
                                onClick={() => setIsSlideOverOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <CommonButton
                                type="submit"
                                disabled={processing}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                            >
                                {processing ? 'Saving...' : 'Save Dip Reading'}
                            </CommonButton>
                        </div>
                    </form>
                </div>
            </SlideOver>
        </AuthenticatedLayout>
    );
}
