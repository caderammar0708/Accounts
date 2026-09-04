import React, { useState } from 'react';
import { usePage, Link } from '@inertiajs/react';
import { Department, PageProps, Staff } from '@/src/types';
import { router as Inertia, Page } from '@inertiajs/react';
import { DateField, SelectField } from '@/src/components/ui/InputFeild';
import moment from 'moment';
import MapComponent from '@/src/components/ui/MapComponent';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CommonButton from '@/Components/CommonButton';

const AttendanceIndexPage: React.FC = () => {
    const { employees = { data: [] }, departments = [], filters } = usePage<Page<PageProps>>().props as any;
    const [date, setDate] = useState(filters?.date || moment().format('YYYY-MM-DD'));
    const [departmentId, setDepartmentId] = useState(filters?.department_id || '');
    const [adjustedOnly, setAdjustedOnly] = useState(filters?.adjusted_only === 'true' || filters?.adjusted_only === true);
    const [localTimes, setLocalTimes] = useState<Record<string, string>>({});
    const [activeTab, setActiveTab] = useState<'list' | 'map'>('list');

    const applyFilters = () => {
        Inertia.get('/attendance', { date, department_id: departmentId, adjusted_only: adjustedOnly }, { preserveState: true });
    };

    const markAttendance = (staffId: string, data: any) => {
        Inertia.post('/attendance', {
            employee_id: staffId,
            date: date,
            ...data
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setLocalTimes(prev => {
                    const next = { ...prev };
                    Object.keys(data).forEach(field => {
                        delete next[`${staffId}_${field}`];
                    });
                    return next;
                });
            }
        });
    };

    const renderTimeInput = (staffId: string, field: string, currentValue: string | null, currentStatus: string) => {
        const key = `${staffId}_${field}`;
        const val = localTimes[key] !== undefined ? localTimes[key] : (currentValue || '');
        
        return (
            <input
                type="time"
                value={val}
                onChange={e => setLocalTimes(prev => ({ ...prev, [key]: e.target.value }))}
                onBlur={e => markAttendance(staffId, { [field]: e.target.value, status: currentStatus || 'Present' })}
                className="text-xs border-slate-200 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary py-1 px-2"
            />
        );
    };

    const renderNoteInput = (staffId: string, currentNote: string | null, currentStatus: string) => {
        const key = `${staffId}_admin_note`;
        const val = localTimes[key] !== undefined ? localTimes[key] : (currentNote || '');
        
        return (
            <textarea
                value={val}
                placeholder="Add note..."
                rows={2}
                onChange={e => setLocalTimes(prev => ({ ...prev, [key]: e.target.value }))}
                onBlur={e => markAttendance(staffId, { admin_note: e.target.value, status: currentStatus || 'Present' })}
                className="text-xs border-slate-200 rounded-lg w-full min-w-[160px] resize-y py-1 px-2 focus:ring-1 focus:ring-primary focus:border-primary"
            />
        );
    };

    const mapMarkers = React.useMemo(() => {
        const markers: any[] = [];
        employees?.data?.forEach((staff: any) => {
            const att = staff.attendances?.[0];
            if (att && att.latitude && att.longitude) {
                markers.push({
                    id: att.id,
                    lat: parseFloat(att.latitude),
                    lng: parseFloat(att.longitude),
                    title: staff.name,
                    type: att.is_remote ? 'remote' : att.is_qr ? 'qr' : 'regular',
                    details: `Check-in: ${att.check_in || 'N/A'}`
                });
            }
        });
        return markers;
    }, [employees]);

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-bold text-lg text-slate-800 tracking-tight">
                    Daily Attendance
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
                                className="whitespace-nowrap py-3 px-1 border-b-2 font-bold text-xs uppercase tracking-wider border-primary text-primary"
                            >
                                Daily Attendance
                            </Link>
                            <Link
                                href="/attendance/report"
                                className="whitespace-nowrap py-3 px-1 border-b-2 font-bold text-xs uppercase tracking-wider border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-colors"
                            >
                                Attendance Report
                            </Link>
                        </nav>
                    </div>

                    {/* Filter Card */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-end">
                        <div className="w-48">
                            <DateField
                                label="Selected Date"
                                value={moment(date).toDate()}
                                onChange={d => setDate(d ? moment(d).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD'))}
                            />
                        </div>
                        <div className="w-48">
                            <SelectField
                                label="Department"
                                value={departmentId}
                                onChange={e => setDepartmentId(e.target.value)}
                            >
                                <option value="">All Departments</option>
                                {departments.map((dep: Department) => (
                                    <option key={dep.id} value={dep.id}>{dep.name}</option>
                                ))}
                            </SelectField>
                        </div>
                        <CommonButton
                            onClick={applyFilters}
                            variant="primary"
                            size="md"
                            className="h-10"
                        >
                            Load Sheet
                        </CommonButton>
                        <div className="flex items-center pb-2 h-10 select-none">
                            <label className="inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={adjustedOnly}
                                    onChange={e => setAdjustedOnly(e.target.checked)}
                                    className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                                />
                                <span className="ml-2 text-xs text-slate-700 font-medium">Show Adjusted Only</span>
                            </label>
                        </div>
                    </div>

                    {/* View Switcher Strip */}
                    <div className="flex justify-between items-center">
                        <div className="text-xs font-semibold text-slate-500">
                            Viewing attendance for <span className="text-slate-800 font-bold">{moment(date).format('LL')}</span>
                        </div>
                        <div className="bg-slate-100 p-1 rounded-lg inline-flex">
                            <button
                                onClick={() => setActiveTab('list')}
                                className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-colors ${activeTab === 'list' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                                List View
                            </button>
                            <button
                                onClick={() => setActiveTab('map')}
                                className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-colors ${activeTab === 'map' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                                Map View
                            </button>
                        </div>
                    </div>

                    {/* Map View */}
                    {activeTab === 'map' && mapMarkers.length > 0 && (
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-800 mb-3">Check-in Locations ({moment(date).format('MMM D, YYYY')})</h3>
                            <div className="flex items-center gap-4 mb-4 text-xs font-semibold">
                                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Remote Check-in</div>
                                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> QR Check-in</div>
                                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span> Regular Check-in</div>
                            </div>
                            <MapComponent markers={mapMarkers} />
                        </div>
                    )}
                    
                    {activeTab === 'map' && mapMarkers.length === 0 && (
                        <div className="bg-white p-12 rounded-xl border border-slate-200 shadow-sm text-center text-xs font-medium text-slate-400">
                            No geolocation data recorded for this date.
                        </div>
                    )}

                    {/* List View */}
                    {activeTab === 'list' && (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                                            <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Check-In</th>
                                            <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Lunch-Out</th>
                                            <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Lunch-In</th>
                                            <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Outside Duty Logs</th>
                                            <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Check-Out</th>
                                            <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-100">
                                        {!employees?.data || employees.data.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="px-6 py-12 text-center text-xs font-medium text-slate-400">
                                                    No employee records found.
                                                </td>
                                            </tr>
                                        ) : (
                                            employees.data.map((staff: Staff & { attendances?: any[] }) => {
                                                const att = staff.attendances?.[0] || {};
                                                return (
                                                    <tr key={staff.id} className="hover:bg-slate-50/70 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-sm font-bold text-slate-900">{staff.name}</span>
                                                                {att.adjustments && att.adjustments.length > 0 && (
                                                                    <span 
                                                                        title={`This attendance was adjusted ${att.adjustments.length} time(s).`}
                                                                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wider cursor-help"
                                                                    >
                                                                        Adjusted
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-slate-400">{staff.designation?.name}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <select
                                                                value={att.status || ''}
                                                                onChange={e => markAttendance(staff.id, { status: e.target.value })}
                                                                className={`text-xs font-semibold rounded-full px-2.5 py-1 border ${
                                                                    att.status === 'Present' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                                    att.status === 'Absent' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                                    'bg-slate-100 text-slate-700 border-slate-200'
                                                                }`}
                                                            >
                                                                <option value="">Mark...</option>
                                                                <option value="Present">Present</option>
                                                                <option value="Late">Late</option>
                                                                <option value="Early Leave">Early Leave</option>
                                                                <option value="Absent">Absent</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-normal">
                                                            <div className="flex flex-col gap-1">
                                                                <div className="flex items-center whitespace-nowrap">
                                                                    {renderTimeInput(staff.id, 'check_in', att.check_in, att.status)}
                                                                    {att.latitude && att.longitude && (
                                                                        <a
                                                                            href={`https://www.google.com/maps/search/?api=1&query=${att.latitude},${att.longitude}`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            title="View Check-In Location"
                                                                            className="inline-flex items-center justify-center p-1.5 ml-2 text-primary bg-primary/10 hover:bg-primary/20 rounded-md border border-primary/20 transition-colors"
                                                                        >
                                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                                                            </svg>
                                                                            {staff.is_field_staff && (
                                                                                <span className="ml-1 text-[9px] font-bold uppercase tracking-wider bg-emerald-200 px-1 rounded text-emerald-800">Field</span>
                                                                            )}
                                                                        </a>
                                                                    )}
                                                                </div>
                                                                {att.is_remote && (
                                                                    <div className="flex flex-col gap-0.5 mt-0.5">
                                                                        <span 
                                                                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider w-fit ${
                                                                                att.remote_status === 'approved' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
                                                                                att.remote_status === 'rejected' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                                                                                'bg-amber-100 text-amber-800 border-amber-200'
                                                                            }`}
                                                                            title={`Remote Status: ${att.remote_status || 'pending'}`}
                                                                        >
                                                                            Remote
                                                                        </span>
                                                                        {att.remote_reason && (
                                                                            <div className="text-[10px] text-slate-500 max-w-[160px] whitespace-normal break-words italic" title={att.remote_reason}>
                                                                                Reason: {att.remote_reason}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {renderTimeInput(staff.id, 'lunch_out', att.lunch_out, att.status)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {renderTimeInput(staff.id, 'lunch_in', att.lunch_in, att.status)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-normal min-w-[200px]">
                                                            <div className="flex flex-col gap-2 text-[11px] max-w-[240px]">
                                                                {att.outside_logs?.map((log: any) => (
                                                                    <div key={log.id} className="bg-sky-50 text-sky-800 p-2 rounded-lg border border-sky-100 flex flex-col gap-1.5 shadow-sm">
                                                                        <div className="flex justify-between items-start gap-2">
                                                                            <span className="font-mono font-semibold shrink-0">{log.out_time?.slice(0,5)} - {log.in_time?.slice(0,5) || 'Open'}</span>
                                                                            <span className="font-medium whitespace-normal break-words flex-1 text-right" title={log.reason}>{log.reason}</span>
                                                                        </div>
                                                                        <div className="flex items-center justify-between gap-2">
                                                                            <span className="text-slate-500 font-bold uppercase text-[9px]">Status:</span>
                                                                            <select
                                                                                value={log.status || 'pending'}
                                                                                onChange={e => {
                                                                                    Inertia.put(`/attendance/outside-log/${log.id}/status`, { status: e.target.value }, { preserveScroll: true });
                                                                                }}
                                                                                className={`text-[10px] font-semibold rounded px-1.5 py-0.5 border bg-white focus:outline-none focus:ring-1 focus:ring-primary ${
                                                                                    log.status === 'approved' ? 'text-emerald-800 border-emerald-300 bg-emerald-50' :
                                                                                    log.status === 'rejected' ? 'text-rose-800 border-rose-300 bg-rose-50' :
                                                                                    log.status === 'cancelled' ? 'text-slate-800 border-slate-300 bg-slate-50' :
                                                                                    'text-amber-800 border-amber-300 bg-amber-50'
                                                                                }`}
                                                                            >
                                                                                <option value="pending">Pending</option>
                                                                                <option value="approved">Approved</option>
                                                                                <option value="rejected">Rejected</option>
                                                                                <option value="cancelled">Cancelled</option>
                                                                            </select>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                                {(!att.outside_logs || att.outside_logs.length === 0) && <span className="text-slate-400 italic">No outdoor duties</span>}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                {renderTimeInput(staff.id, 'check_out', att.check_out, att.status)}
                                                                {att.checkout_latitude && att.checkout_longitude && (
                                                                    <a
                                                                        href={`https://www.google.com/maps/search/?api=1&query=${att.checkout_latitude},${att.checkout_longitude}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        title="View Check-Out Location"
                                                                        className="inline-flex items-center justify-center p-1.5 ml-2 text-primary bg-primary/10 hover:bg-primary/20 rounded-md border border-primary/20 transition-colors"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                                                        </svg>
                                                                        {staff.is_field_staff && (
                                                                            <span className="ml-1 text-[9px] font-bold uppercase tracking-wider bg-emerald-200 px-1 rounded text-emerald-800">Field</span>
                                                                        )}
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-normal min-w-[200px]">
                                                            <div className="flex flex-col gap-2">
                                                                {renderNoteInput(staff.id, att.admin_note, att.status)}
                                                                {att.adjustments && att.adjustments.length > 0 && (
                                                                    <div className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200 max-h-24 overflow-y-auto">
                                                                        <div className="font-semibold text-slate-700 mb-1">Adjustment History:</div>
                                                                        {att.adjustments.map((adj: any) => (
                                                                            <div key={adj.id} className="mb-1 pb-1 border-b border-slate-200 last:border-0 last:mb-0 last:pb-0">
                                                                                <div className="text-slate-400">{moment(adj.created_at).format('MMM D, HH:mm')} by {adj.adjuster?.name}</div>
                                                                                <div className="whitespace-normal leading-tight">
                                                                                    {adj.reason}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default AttendanceIndexPage;

