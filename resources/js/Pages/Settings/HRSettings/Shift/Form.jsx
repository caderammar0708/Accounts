import React from 'react';
import { useForm, Link } from '@inertiajs/react';
import HRSettingsLayout from '../HRSettingsLayout';
import CommonButton from '@/Components/CommonButton';
import CommonInput from '@/Components/CommonInput';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function Form({ shift }) {
    const isEditing = !!shift;

    const { data, setData, post, put, processing, errors } = useForm({
        name: shift?.name || '',
        start_time: shift?.start_time ? shift.start_time.substring(0, 5) : '',
        end_time: shift?.end_time ? shift.end_time.substring(0, 5) : '',
        half_day_start_time: shift?.half_day_start_time ? shift.half_day_start_time.substring(0, 5) : '',
        half_day_end_time: shift?.half_day_end_time ? shift.half_day_end_time.substring(0, 5) : '',
        working_days: shift?.working_days || DAYS_OF_WEEK,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (isEditing) {
            put(route('settings.hr.shifts.update', shift.id), {
                preserveScroll: true,
            });
        } else {
            post(route('settings.hr.shifts.store'), {
                preserveScroll: true,
            });
        }
    };

    const toggleDay = (day) => {
        if (data.working_days.includes(day)) {
            setData('working_days', data.working_days.filter(d => d !== day));
        } else {
            setData('working_days', [...data.working_days, day]);
        }
    };

    return (
        <HRSettingsLayout activeTab="shift">
            <div className="max-w-4xl pb-12">
                <div className="mb-4">
                    <Link
                        href={route('settings.hr.shifts.index')}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-wider"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Back to Shifts
                    </Link>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-sm font-bold text-slate-800">{isEditing ? 'Edit Shift' : 'Create Shift'}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Define working hours and designated work days.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-8">
                        <div className="max-w-md">
                            <CommonInput
                                label="Shift Name"
                                name="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                error={errors.name}
                                placeholder="e.g. Morning Shift"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">Full Day Timings</h4>
                                <CommonInput
                                    label="Start Time"
                                    type="time"
                                    value={data.start_time}
                                    onChange={(e) => setData('start_time', e.target.value)}
                                    error={errors.start_time}
                                />
                                <CommonInput
                                    label="End Time"
                                    type="time"
                                    value={data.end_time}
                                    onChange={(e) => setData('end_time', e.target.value)}
                                    error={errors.end_time}
                                />
                                <p className="text-xs text-slate-400 italic">Leave blank if the shift has flexible hours.</p>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">Half Day Timings</h4>
                                <CommonInput
                                    label="Half Day Start Time"
                                    type="time"
                                    value={data.half_day_start_time}
                                    onChange={(e) => setData('half_day_start_time', e.target.value)}
                                    error={errors.half_day_start_time}
                                />
                                <CommonInput
                                    label="Half Day End Time"
                                    type="time"
                                    value={data.half_day_end_time}
                                    onChange={(e) => setData('half_day_end_time', e.target.value)}
                                    error={errors.half_day_end_time}
                                />
                                <p className="text-xs text-slate-400 italic">Optional. Only applied when staff take half day leave.</p>
                            </div>
                        </div>

                        <div className="bg-slate-50/50 p-5 rounded-lg border border-slate-100">
                            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-1">Working Days</h4>
                            <p className="text-xs text-slate-400 mb-4">Select the days this shift is active. Unselected days will be treated as off-days.</p>
                            
                            <div className="flex flex-wrap gap-2.5">
                                {DAYS_OF_WEEK.map(day => {
                                    const isSelected = data.working_days.includes(day);
                                    return (
                                        <button
                                            key={day}
                                            type="button"
                                            onClick={() => toggleDay(day)}
                                            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
                                                isSelected 
                                                    ? 'bg-primary text-white border border-primary shadow-sm' 
                                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                            }`}
                                        >
                                            {day}
                                        </button>
                                    );
                                })}
                            </div>
                            {errors.working_days && <span className="text-red-500 text-xs mt-2 block">{errors.working_days}</span>}
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                            <CommonButton variant="secondary" href={route('settings.hr.shifts.index')}>
                                Cancel
                            </CommonButton>
                            <CommonButton type="submit" variant="primary" processing={processing}>
                                {isEditing ? 'Save Changes' : 'Create Shift'}
                            </CommonButton>
                        </div>
                    </form>
                </div>
            </div>
        </HRSettingsLayout>
    );
}
