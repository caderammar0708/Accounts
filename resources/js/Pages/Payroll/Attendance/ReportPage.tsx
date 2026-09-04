import React, { useState } from 'react';
import { usePage, Link } from '@inertiajs/react';
import { PageProps } from '@/src/types';
import { router as Inertia, Page } from '@inertiajs/react';
import moment from 'moment';
import CommonButton from '@/Components/CommonButton';
import { InputField, SelectField } from '@/src/components/ui/InputFeild';
import * as XLSX from 'xlsx';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const AttendanceReportPage: React.FC = () => {
    const { attendances = [], employees = [], filters } = usePage<Page<PageProps>>().props as any;
    const [fromDate, setFromDate] = useState(filters?.from_date || moment().startOf('month').format('YYYY-MM-DD'));
    const [toDate, setToDate] = useState(filters?.to_date || moment().endOf('month').format('YYYY-MM-DD'));
    const [staffId, setStaffId] = useState(filters?.employee_id || '');
    const [loading, setLoading] = useState(false);

    const applyFilters = () => {
        setLoading(true);
        Inertia.get('/attendance/report', { from_date: fromDate, to_date: toDate, employee_id: staffId }, {
            preserveState: true,
            onFinish: () => setLoading(false)
        });
    };

    const exportToExcel = () => {
        const headers = ['Employee', 'Staff No', 'Date', 'Status', 'Check In', 'Lunch Out', 'Lunch In', 'Check Out', 'Outside Logs', 'Total Outside Hours', 'Total Working Hours'];
        
        const excelData = attendances.map((att: any) => {
            const formatTime = (timeStr: string | null) => timeStr ? moment(timeStr, ['HH:mm:ss', 'HH:mm', 'H:i']).format('hh:mm A') : '-';
            
            let outsideTotalMinutes = 0;
            let outsideLogsStr = '';
            if (att.outside_logs && att.outside_logs.length > 0) {
                att.outside_logs.forEach((log: any) => {
                    const outT = log.out_time ? moment(log.out_time, ['HH:mm:ss', 'HH:mm']) : null;
                    const inT = log.in_time ? moment(log.in_time, ['HH:mm:ss', 'HH:mm']) : null;
                    if (outT && inT && log.status?.toLowerCase() === 'approved') {
                        outsideTotalMinutes += inT.diff(outT, 'minutes');
                    }
                    outsideLogsStr += `${log.reason} (${formatTime(log.out_time)} - ${formatTime(log.in_time)}) | `;
                });
            }
            const outsideTotalHours = (outsideTotalMinutes / 60).toFixed(2);

            return [
                att.staff?.name || 'N/A',
                att.staff?.staff_no || '',
                moment(att.date).format('DD MMM YYYY'),
                att.status || 'Present',
                formatTime(att.check_in),
                formatTime(att.lunch_out),
                formatTime(att.lunch_in),
                formatTime(att.check_out),
                outsideLogsStr,
                outsideTotalHours,
                att.total_working_hours || 0
            ];
        });

        // Insert headers
        excelData.unshift(headers);

        const ws = XLSX.utils.aoa_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Attendance Report");

        XLSX.writeFile(wb, `Attendance_Report_${fromDate}_to_${toDate}.xlsx`);
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-bold text-lg text-slate-800 tracking-tight">
                    Attendance Report
                </h2>
            }
        >
            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                    {/* Navigation Tab Bar */}
                    <div className="border-b border-slate-200">
                        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                            <Link
                                href="/attendance"
                                className="whitespace-nowrap py-3 px-1 border-b-2 font-bold text-xs uppercase tracking-wider border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-colors"
                            >
                                Daily Attendance
                            </Link>
                            <Link
                                href="/attendance/report"
                                className="whitespace-nowrap py-3 px-1 border-b-2 font-bold text-xs uppercase tracking-wider border-primary text-primary"
                            >
                                Attendance Report
                            </Link>
                        </nav>
                    </div>
                    
                    {/* Filter Card */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-end justify-between gap-5">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <InputField
                                label="From Date"
                                type="date"
                                value={fromDate}
                                onChange={e => setFromDate(e.target.value)}
                                containerClassName="w-full"
                            />
                            <InputField
                                label="To Date"
                                type="date"
                                value={toDate}
                                onChange={e => setToDate(e.target.value)}
                                containerClassName="w-full"
                            />
                            <SelectField
                                label="Employee Filter"
                                value={staffId}
                                onChange={e => setStaffId(e.target.value)}
                                containerClassName="w-full"
                            >
                                <option value="">All Employees</option>
                                {employees?.map((s: any) => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.staff_no})</option>
                                ))}
                            </SelectField>
                        </div>

                        <div className="shrink-0 flex gap-2.5">
                            <CommonButton
                                onClick={exportToExcel}
                                variant="secondary"
                                size="md"
                            >
                                Export Excel
                            </CommonButton>
                            <CommonButton
                                onClick={applyFilters}
                                variant="primary"
                                size="md"
                                processing={loading}
                            >
                                View Report
                            </CommonButton>
                        </div>
                    </div>

                    {/* Attendance Table Card */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        {/* Card Header */}
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 tracking-tight">Monthly Attendance Registry</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Logs of active employee clock-in, clock-out times and field geolocation data.</p>
                            </div>
                            <span className="text-xs font-semibold text-slate-500">
                                {moment(fromDate).format('DD MMM YYYY')} &mdash; {moment(toDate).format('DD MMM YYYY')}
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Check In</th>
                                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Lunch Out</th>
                                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Lunch In</th>
                                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Check Out</th>
                                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Total Hours</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-100">
                                    {!attendances || attendances.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-12 text-center text-xs font-medium text-slate-400">
                                                No attendance entries tracked for this period.
                                            </td>
                                        </tr>
                                    ) : (
                                        attendances.map((att: any) => {
                                            const formatTime = (timeStr: string | null) => {
                                                if (!timeStr) return '-';
                                                return moment(timeStr, ['HH:mm:ss', 'HH:mm', 'H:i']).format('hh:mm A');
                                            };

                                            return (
                                                <tr key={att.id} className="hover:bg-slate-50/70 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-left">
                                                        <div className="text-sm font-bold text-slate-900 leading-tight">{att.staff?.name || 'N/A'}</div>
                                                        <div className="text-xs text-slate-400 font-semibold mt-0.5">{att.staff?.staff_no}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-600">
                                                        {moment(att.date).format('DD MMM YYYY')}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-full border ${
                                                            att.status?.toLowerCase() === 'present' 
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                                                : att.status?.toLowerCase() === 'late'
                                                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                                : 'bg-rose-50 text-rose-700 border-rose-200'
                                                        }`}>
                                                            {att.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                                                        <div className="flex items-center gap-2">
                                                            <span>{formatTime(att.check_in)}</span>
                                                            {att.latitude && att.longitude && (
                                                                <a
                                                                    href={`https://www.google.com/maps/search/?api=1&query=${att.latitude},${att.longitude}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    title="View Check-In Location"
                                                                    className="inline-flex items-center justify-center p-1.5 text-primary bg-primary/10 hover:bg-primary/20 rounded-md border border-primary/20 transition-colors"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                                                    </svg>
                                                                    {att.staff?.is_field_staff && (
                                                                        <span className="ml-1 text-[8px] font-bold uppercase tracking-wider bg-emerald-200 px-1 py-0.5 rounded text-emerald-800">Field</span>
                                                                    )}
                                                                </a>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-500">
                                                        {formatTime(att.lunch_out)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-500">
                                                        {formatTime(att.lunch_in)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                                                        <div className="flex items-center gap-2">
                                                            <span>{formatTime(att.check_out)}</span>
                                                            {att.checkout_latitude && att.checkout_longitude && (
                                                                <a
                                                                    href={`https://www.google.com/maps/search/?api=1&query=${att.checkout_latitude},${att.checkout_longitude}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    title="View Check-Out Location"
                                                                    className="inline-flex items-center justify-center p-1.5 text-primary bg-primary/10 hover:bg-primary/20 rounded-md border border-primary/20 transition-colors"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                                                    </svg>
                                                                    {att.staff?.is_field_staff && (
                                                                        <span className="ml-1 text-[8px] font-bold uppercase tracking-wider bg-emerald-200 px-1 py-0.5 rounded text-emerald-800">Field</span>
                                                                    )}
                                                                </a>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary">
                                                        {att.total_working_hours || 0} hrs
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default AttendanceReportPage;

