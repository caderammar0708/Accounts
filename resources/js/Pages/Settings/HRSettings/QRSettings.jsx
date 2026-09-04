import React from 'react';
import { useForm } from '@inertiajs/react';
import HRSettingsLayout from './HRSettingsLayout';
import CommonButton from '@/Components/CommonButton';
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
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-sm font-bold text-slate-800">QR Code Settings</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Configure attendance QR code behavior.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">QR Code Type</label>
                            <div className="grid grid-cols-2 gap-4">
                                <label className={`flex items-center justify-center gap-2 p-3.5 border rounded-lg cursor-pointer transition-all ${data.qr_type === 'Static' ? 'bg-primary text-white border-primary shadow-sm' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}>
                                    <input
                                        type="radio"
                                        name="qr_type"
                                        value="Static"
                                        checked={data.qr_type === 'Static'}
                                        onChange={(e) => setData('qr_type', e.target.value)}
                                        className="hidden"
                                    />
                                    <span className="text-xs font-bold uppercase tracking-wider">Static QR</span>
                                </label>
                                <label className={`flex items-center justify-center gap-2 p-3.5 border rounded-lg cursor-pointer transition-all ${data.qr_type === 'Dynamic' ? 'bg-primary text-white border-primary shadow-sm' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}>
                                    <input
                                        type="radio"
                                        name="qr_type"
                                        value="Dynamic"
                                        checked={data.qr_type === 'Dynamic'}
                                        onChange={(e) => setData('qr_type', e.target.value)}
                                        className="hidden"
                                    />
                                    <span className="text-xs font-bold uppercase tracking-wider">Dynamic QR</span>
                                </label>
                            </div>
                            <p className="mt-2 text-xs text-slate-400">Static QR code never changes. Dynamic QR code refreshes automatically for enhanced security.</p>
                            {errors.qr_type && <span className="text-red-500 text-xs mt-1 block">{errors.qr_type}</span>}
                        </div>

                        {data.qr_type === 'Dynamic' && (
                            <div className="bg-slate-50/50 p-4 rounded-lg border border-slate-100 space-y-2">
                                <CommonInput
                                    label="Refresh Interval (Minutes)"
                                    type="number"
                                    value={data.qr_dynamic_interval}
                                    onChange={(e) => setData('qr_dynamic_interval', e.target.value)}
                                    min="1"
                                    max="60"
                                    error={errors.qr_dynamic_interval}
                                />
                                <p className="text-xs text-slate-400">How often the QR code should automatically regenerate on the attendance screen.</p>
                            </div>
                        )}

                        <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                            <CommonButton type="submit" variant="primary" processing={processing} disabled={!isDirty || processing}>
                                Save QR Settings
                            </CommonButton>
                        </div>
                    </form>
                </div>
            </div>
        </HRSettingsLayout>
    );
}
