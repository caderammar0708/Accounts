import React, { useEffect } from 'react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { usePageHeader } from '@/src/App';
import { PageProps, Staff, LeaveType } from '@/src/types';
import { SelectField, TextareaField, DateField } from '@/src/components/ui/InputFeild';

import Button from '@/src/components/ui/Button';
import moment from 'moment';

const LeaveRequestFormPage: React.FC = () => {
    const { employees, leaveTypes } = usePage<Page<PageProps>>().props as any;
    const { setTitle } = usePageHeader();

    const { data, setData, post, processing, errors } = useForm({
        employee_id: '',
        leave_type_id: '',
        day_type: 'Full Day',
        start_date: '',
        end_date: '',
        start_time: '',
        end_time: '',
        reason: '',
    });

    useEffect(() => {
        setTitle('Apply for Leave');
    }, [setTitle]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/leave-request');
    };

    return (
        <div className="max-w-lg mx-auto pb-12">
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                
                {/* Modern Slate Header Banner */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 border-b border-slate-200">
                    <h3 className="text-base font-bold text-white tracking-wide">Submit Leave Request</h3>
                    <p className="text-slate-400 text-xs mt-0.5">Apply for formal leaves and half-days for administrative processing.</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <SelectField
                        label="Select Employee"
                        name="employee_id"
                        value={data.employee_id}
                        onChange={e => setData('employee_id', e.target.value)}
                        error={errors.employee_id}
                        required
                    >
                        <option value="">Choose an employee...</option>
                        {employees.map((s: Staff) => (
                            <option key={s.id} value={s.id}>{s.name} ({s.staff_no})</option>
                        ))}
                    </SelectField>

                    <SelectField
                        label="Leave Category"
                        name="leave_type_id"
                        value={data.leave_type_id}
                        onChange={e => setData('leave_type_id', e.target.value)}
                        error={errors.leave_type_id}
                        required
                    >
                        <option value="">Choose a leave type...</option>
                        {leaveTypes.map((t: LeaveType) => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </SelectField>

                    <SelectField
                        label="Day Type Configuration"
                        name="day_type"
                        value={data.day_type}
                        onChange={e => {
                            const val = e.target.value;
                            setData(prev => ({
                                ...prev,
                                day_type: val,
                                end_date: (val === 'Half Day' || val === 'Short Leave') ? prev.start_date : prev.end_date
                            }));
                        }}
                        error={errors.day_type}
                        required
                    >
                        <option value="Full Day">Full Day Allocation</option>
                        <option value="Half Day">Half Day Allocation</option>
                        <option value="Short Leave">Short Leave</option>
                    </SelectField>

                    <div className={data.day_type !== 'Full Day' ? "grid grid-cols-1" : "grid grid-cols-2 gap-4"}>
                        <DateField
                            label={data.day_type !== 'Full Day' ? "Date" : "Start Date"}
                            value={data.start_date ? moment(data.start_date).toDate() : null}
                            onChange={d => {
                                const dateStr = d ? moment(d).format('YYYY-MM-DD') : '';
                                setData(prev => ({
                                    ...prev,
                                    start_date: dateStr,
                                    end_date: prev.day_type !== 'Full Day' ? dateStr : prev.end_date
                                }));
                            }}
                            error={errors.start_date}
                        />
                        {data.day_type === 'Full Day' && (
                            <DateField
                                label="End Date"
                                value={data.end_date ? moment(data.end_date).toDate() : null}
                                onChange={d => setData('end_date', d ? moment(d).format('YYYY-MM-DD') : '')}
                                error={errors.end_date}
                            />
                        )}
                    </div>

                    {data.day_type === 'Short Leave' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Start Time</label>
                                <input 
                                    type="time" 
                                    value={data.start_time}
                                    onChange={e => setData('start_time', e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 shadow-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">End Time</label>
                                <input 
                                    type="time" 
                                    value={data.end_time}
                                    onChange={e => setData('end_time', e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 shadow-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <TextareaField
                        label="Justification / Reason"
                        name="reason"
                        value={data.reason}
                        onChange={e => setData('reason', e.target.value)}
                        error={errors.reason}
                        placeholder="State brief justification for leave request..."
                        rows={3}
                    />

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                        <Link 
                            href="/leave-request" 
                            className="flex items-center justify-center px-8 py-2.5 text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition duration-150 active:scale-[0.98]"
                        >
                            Cancel
                        </Link>
                        <Button
                            type="submit"
                            loading={processing}
                            loadingText="Submitting..."
                        >
                            Apply for Leave
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LeaveRequestFormPage;
