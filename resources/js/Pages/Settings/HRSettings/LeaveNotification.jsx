import React from 'react';
import { useForm } from '@inertiajs/react';
import HRSettingsLayout from './HRSettingsLayout';
import CommonButton from '@/Components/CommonButton';
import CommonInput from '@/Components/CommonInput';

export default function LeaveNotification({ settings }) {
    const { data, setData, post, processing, errors, isDirty } = useForm({
        receiver_email: settings?.receiver_email || '',
        cc_emails: settings?.cc_emails || '',
        bcc_emails: settings?.bcc_emails || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('settings.hr.leave-notification.update'), {
            preserveScroll: true,
        });
    };

    return (
        <HRSettingsLayout activeTab="leave-notification">
            <div className="max-w-3xl pb-12">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-sm font-bold text-slate-800">Leave Notification Routing</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Configure automated email recipients for employee leave requests.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-200/60 flex items-start gap-2.5">
                            <span className="material-symbols-outlined text-primary text-base shrink-0 mt-0.5">notifications</span>
                            <span>Configure who gets notified automatically when employees submit a leave request. You can input multiple email addresses separated by commas for CC and BCC fields.</span>
                        </div>

                        <div className="space-y-5">
                            <CommonInput
                                label="Receiver Email Address"
                                name="receiver_email"
                                type="email"
                                value={data.receiver_email}
                                error={errors.receiver_email}
                                onChange={(e) => setData('receiver_email', e.target.value)}
                                placeholder="e.g. hr@company.com"
                                required
                            />
                            <CommonInput
                                label="CC Email Addresses (Comma Separated)"
                                name="cc_emails"
                                value={data.cc_emails}
                                error={errors.cc_emails}
                                onChange={(e) => setData('cc_emails', e.target.value)}
                                placeholder="e.g. manager1@company.com, manager2@company.com"
                            />
                            <CommonInput
                                label="BCC Email Addresses (Comma Separated)"
                                name="bcc_emails"
                                value={data.bcc_emails}
                                error={errors.bcc_emails}
                                onChange={(e) => setData('bcc_emails', e.target.value)}
                                placeholder="e.g. archive@company.com, audit@company.com"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <CommonButton type="submit" variant="primary" processing={processing} disabled={!isDirty || processing}>
                                Save Settings
                            </CommonButton>
                        </div>
                    </form>
                </div>
            </div>
        </HRSettingsLayout>
    );
}
