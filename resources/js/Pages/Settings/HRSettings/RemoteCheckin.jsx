import React from 'react';
import { useForm } from '@inertiajs/react';
import HRSettingsLayout from './HRSettingsLayout';
import CommonButton from '@/Components/CommonButton';

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
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-sm font-bold text-slate-800">Remote Check-in Configuration</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Manage how mobile remote check-ins are approved in the system.</p>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="border border-slate-100 p-5 rounded-lg flex justify-between items-center bg-slate-50/30">
                            <div>
                                <h4 className="text-xs font-bold text-slate-800">Auto Approve Remote Check-in</h4>
                                <p className="text-xs text-slate-500 mt-0.5">If enabled, remote check-ins from the mobile app are automatically approved. If disabled, a manager must manually approve them.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer scale-90 shrink-0 ml-4">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={data.remote_checkin_auto_approve}
                                    onChange={() => setData('remote_checkin_auto_approve', !data.remote_checkin_auto_approve)}
                                />
                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>

                        <div className="border border-slate-100 p-5 rounded-lg flex justify-between items-center bg-slate-50/30">
                            <div>
                                <h4 className="text-xs font-bold text-slate-800">Auto Approve Prayer Break</h4>
                                <p className="text-xs text-slate-500 mt-0.5">If enabled, prayer break requests are automatically approved by the system.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer scale-90 shrink-0 ml-4">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={data.prayer_break_auto_approve}
                                    onChange={() => setData('prayer_break_auto_approve', !data.prayer_break_auto_approve)}
                                />
                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <CommonButton type="submit" variant="primary" processing={processing} disabled={!isDirty || processing}>
                        Save Configuration
                    </CommonButton>
                </div>
            </form>
        </HRSettingsLayout>
    );
}
