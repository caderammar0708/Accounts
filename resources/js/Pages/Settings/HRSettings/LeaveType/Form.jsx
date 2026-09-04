import React from 'react';
import { useForm, Link } from '@inertiajs/react';
import HRSettingsLayout from '../HRSettingsLayout';
import CommonButton from '@/Components/CommonButton';
import CommonInput from '@/Components/CommonInput';
import SearchableSelect from '@/Components/SearchableSelect';

export default function Form({ leaveType }) {
    const isEditing = !!leaveType;

    const limitTypeOptions = [
        { value: 'month', label: 'Per Month' },
        { value: 'week', label: 'Per Week' }
    ];

    const { data, setData, post, put, processing, errors } = useForm({
        name: leaveType?.name || '',
        days_per_year: leaveType?.days_per_year || '',
        is_short_leave: !!leaveType?.is_short_leave,
        short_leave_limit_type: leaveType?.short_leave_limit_type || 'month',
        short_leave_limit: leaveType?.short_leave_limit || '',
        short_leave_time_minutes: leaveType?.short_leave_time_minutes || '',
        comment: leaveType?.comment || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (isEditing) {
            put(route('settings.hr.leave-types.update', leaveType.id), {
                preserveScroll: true,
            });
        } else {
            post(route('settings.hr.leave-types.store'), {
                preserveScroll: true,
            });
        }
    };

    return (
        <HRSettingsLayout activeTab="leave-types">
            <div className="max-w-4xl pb-12 space-y-4">
                <div className="flex items-center justify-between">
                    <Link 
                        href={route('settings.hr.leave-types.index')} 
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-primary transition-colors uppercase tracking-wider"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Leave Types
                    </Link>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-sm font-bold text-slate-800 tracking-tight">
                            {isEditing ? 'Edit Leave Type' : 'Create Leave Type'}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">Configure leave balances and constraints.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <CommonInput
                                label="Leave Name"
                                name="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                error={errors.name}
                                placeholder="e.g. Annual Leave, Casual Leave"
                                required
                            />
                            <CommonInput
                                label="Total Days Per Year"
                                type="number"
                                name="days_per_year"
                                value={data.days_per_year}
                                onChange={(e) => setData('days_per_year', e.target.value)}
                                error={errors.days_per_year}
                                min="0"
                                required
                            />
                        </div>

                        <div className="border border-slate-100 p-5 rounded-lg bg-slate-50/30">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-800">Is this a Short Leave?</h4>
                                    <p className="text-xs text-slate-500 mt-0.5">Enable this if the leave type is used for partial-day absences (e.g. 1 or 2 hours).</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer scale-90 shrink-0 ml-4">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={data.is_short_leave}
                                        onChange={(e) => setData('is_short_leave', e.target.checked)}
                                    />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>

                            {data.is_short_leave && (
                                <div className="mt-4 border-t border-slate-200/60 pt-4 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Limit Period</label>
                                            <SearchableSelect
                                                options={limitTypeOptions}
                                                value={limitTypeOptions.find(o => o.value === data.short_leave_limit_type)}
                                                onChange={(s) => setData('short_leave_limit_type', s?.value)}
                                                placeholder="Select..."
                                            />
                                            {errors.short_leave_limit_type && <span className="text-red-500 text-xs mt-1 block">{errors.short_leave_limit_type}</span>}
                                        </div>
                                        <CommonInput
                                            label={`Maximum allowed per ${data.short_leave_limit_type || 'period'}`}
                                            type="number"
                                            value={data.short_leave_limit}
                                            onChange={(e) => setData('short_leave_limit', e.target.value)}
                                            error={errors.short_leave_limit}
                                            min="1"
                                            placeholder="e.g. 2"
                                        />
                                    </div>
                                    <div className="w-full md:w-1/2">
                                        <CommonInput
                                            label="Time allowed per request (Minutes)"
                                            type="number"
                                            value={data.short_leave_time_minutes}
                                            onChange={(e) => setData('short_leave_time_minutes', e.target.value)}
                                            error={errors.short_leave_time_minutes}
                                            min="1"
                                            placeholder="e.g. 120"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Description / Guidelines (Optional)</label>
                            <textarea
                                value={data.comment}
                                onChange={(e) => setData('comment', e.target.value)}
                                className="w-full border border-slate-300 rounded-md shadow-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 text-xs text-slate-800 p-3 transition-all placeholder-slate-400"
                                rows="3"
                                placeholder="Add notes about this leave type for employees..."
                            ></textarea>
                            {errors.comment && <span className="text-red-500 text-xs mt-1 block">{errors.comment}</span>}
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                            <CommonButton 
                                type="button" 
                                variant="secondary" 
                                href={route('settings.hr.leave-types.index')}
                            >
                                Cancel
                            </CommonButton>
                            <CommonButton 
                                type="submit" 
                                variant="primary" 
                                processing={processing}
                            >
                                {isEditing ? 'Save Changes' : 'Create Leave Type'}
                            </CommonButton>
                        </div>
                    </form>
                </div>
            </div>
        </HRSettingsLayout>
    );
}
