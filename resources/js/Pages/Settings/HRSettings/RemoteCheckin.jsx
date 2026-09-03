import React from 'react';
import { useForm } from '@inertiajs/react';
import HRSettingsLayout from './HRSettingsLayout';
import PrimaryButton from '@/Components/PrimaryButton';

export default function RemoteCheckin({ settings }) {
    const { data, setData, post, processing, isDirty } = useForm({
        remote_checkin_auto_approve: !!settings?.remote_checkin_auto_approve,
        prayer_break_auto_approve: !!settings?.prayer_break_auto_approve,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('settings.hr.remote-checkin.update'), {
            preserveScroll: true,
        });
    };

    return (
        <HRSettingsLayout activeTab="remote-checkin">
            <form onSubmit={handleSubmit} className="max-w-4xl space-y-6 pb-12">
                <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 border-b border-slate-200">
                        <h3 className="text-base font-bold text-white tracking-wide">Remote Check-in Configuration</h3>
                        <p className="text-slate-400 text-xs mt-0.5">Manage how mobile remote check-ins are approved in the system.</p>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="bg-slate-50 border border-slate-100 p-5 rounded-lg flex justify-between items-center">
                            <div>
                                <h4 className="text-sm font-bold text-slate-800">Auto Approve Remote Check-in</h4>
                                <p className="text-xs text-slate-500">If enabled, remote check-ins from the mobile app are automatically approved. If disabled, a manager must manually approve them.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setData('remote_checkin_auto_approve', !data.remote_checkin_auto_approve)}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${data.remote_checkin_auto_approve ? 'bg-emerald-600' : 'bg-slate-300'}`}
                            >
                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${data.remote_checkin_auto_approve ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        <div className="bg-slate-50 border border-slate-100 p-5 rounded-lg flex justify-between items-center">
                            <div>
                                <h4 className="text-sm font-bold text-slate-800">Auto Approve Prayer Break</h4>
                                <p className="text-xs text-slate-500">If enabled, prayer break requests are automatically approved by the system.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setData('prayer_break_auto_approve', !data.prayer_break_auto_approve)}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${data.prayer_break_auto_approve ? 'bg-emerald-600' : 'bg-slate-300'}`}
                            >
                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${data.prayer_break_auto_approve ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200/80 shadow-sm">
                    <PrimaryButton type="submit" disabled={!isDirty || processing}>
                        Save Configuration Settings
                    </PrimaryButton>
                </div>
            </form>
        </HRSettingsLayout>
    );
}
