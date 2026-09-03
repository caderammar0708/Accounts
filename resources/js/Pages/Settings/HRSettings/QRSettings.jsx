import React from 'react';
import { useForm } from '@inertiajs/react';
import HRSettingsLayout from './HRSettingsLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import CommonInput from '@/Components/CommonInput';

export default function QRSettings({ settings }) {
    const { data, setData, post, processing, errors, isDirty } = useForm({
        qr_type: settings?.qr_type || 'Dynamic',
        qr_dynamic_interval: settings?.qr_dynamic_interval || 1,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('settings.hr.qr.update'), {
            preserveScroll: true,
        });
    };

    return (
        <HRSettingsLayout activeTab="qr">
            <div className="max-w-3xl pb-12">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 border-b border-slate-200 rounded-t-xl">
                        <h3 className="text-base font-bold text-white tracking-wide">QR Code Settings</h3>
                        <p className="text-slate-400 text-xs mt-0.5">Configure attendance QR code behavior.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">QR Code Type</label>
                            <div className="flex gap-4">
                                <label className={`flex-1 flex items-center justify-center gap-2 p-4 border rounded-xl cursor-pointer transition-all ${data.qr_type === 'Static' ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}>
                                    <input
                                        type="radio"
                                        name="qr_type"
                                        value="Static"
                                        checked={data.qr_type === 'Static'}
                                        onChange={(e) => setData('qr_type', e.target.value)}
                                        className="hidden"
                                    />
                                    <span className="font-semibold">Static</span>
                                </label>
                                <label className={`flex-1 flex items-center justify-center gap-2 p-4 border rounded-xl cursor-pointer transition-all ${data.qr_type === 'Dynamic' ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}>
                                    <input
                                        type="radio"
                                        name="qr_type"
                                        value="Dynamic"
                                        checked={data.qr_type === 'Dynamic'}
                                        onChange={(e) => setData('qr_type', e.target.value)}
                                        className="hidden"
                                    />
                                    <span className="font-semibold">Dynamic</span>
                                </label>
                            </div>
                            <p className="mt-2 text-xs text-slate-500">Static QR code never changes. Dynamic QR code refreshes automatically for better security.</p>
                            {errors.qr_type && <span className="text-red-500 text-xs mt-1 block">{errors.qr_type}</span>}
                        </div>

                        {data.qr_type === 'Dynamic' && (
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <CommonInput
                                    label="Refresh Interval (Minutes)"
                                    type="number"
                                    value={data.qr_dynamic_interval}
                                    onChange={(e) => setData('qr_dynamic_interval', e.target.value)}
                                    min="1"
                                    max="60"
                                    error={errors.qr_dynamic_interval}
                                />
                                <p className="mt-2 text-xs text-slate-500">How often the QR code should automatically regenerate on the public screen.</p>
                            </div>
                        )}

                        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-3">
                            <PrimaryButton type="submit" disabled={!isDirty || processing}>
                                Save QR Settings
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </HRSettingsLayout>
    );
}
