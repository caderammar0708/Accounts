import React, { useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { usePageHeader } from '@/src/App';
import { LeaveType, PageProps } from '@/src/types';
import { PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@/src/components/icons/Icons';
import ConfirmationModal from '@/src/components/ui/ConfirmationModal';
import { router as Inertia, Page } from '@inertiajs/react';
import { InputField, TextareaField } from '@/src/components/ui/InputFeild';
import Button from '@/src/components/ui/Button';
import moment from 'moment';

interface Staff {
    id: number;
    name: string;
    staff_no?: string;
}

const LeaveTypesPage: React.FC = () => {
    const { leaveTypes, employees = [] } = usePage<Page<PageProps>>().props as any;
    const { setTitle } = usePageHeader();
    const [editingType, setEditingType] = useState<LeaveType | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<LeaveType | null>(null);
    
    // Assignment modal state
    const [assigningType, setAssigningType] = useState<LeaveType | null>(null);
    const [searchStaff, setSearchStaff] = useState<string>('');
    const [selectedStaffs, setSelectedStaffs] = useState<number[]>([]);
    const [assignDays, setAssignDays] = useState<number>(0);
    const [assignYear, setAssignYear] = useState<number>(new Date().getFullYear());
    const [autoCalculate, setAutoCalculate] = useState<boolean>(true);
    const [submittingAssign, setSubmittingAssign] = useState<boolean>(false);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        days_per_year: 0,
        applies_sl_joining_rules: false,
        applies_probation_half_rate: false,
        comment: '',
        is_short_leave: false,
        short_leave_limit_type: 'month',
        short_leave_limit: 0,
        short_leave_time_minutes: 0,
    });

    React.useEffect(() => {
        setTitle('Leave Types Configuration');
    }, [setTitle]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingType) {
            put(`/leave-type/${editingType.id}`, {
                onSuccess: () => {
                    setEditingType(null);
                    reset();
                }
            });
        } else {
            post('/leave-type', {
                onSuccess: () => reset()
            });
        }
    };

    const startEdit = (type: LeaveType) => {
        setEditingType(type);
        setData({
            name: type.name,
            days_per_year: type.days_per_year,
            applies_sl_joining_rules: !!type.applies_sl_joining_rules,
            applies_probation_half_rate: !!type.applies_probation_half_rate,
            comment: type.comment || '',
            is_short_leave: !!type.is_short_leave,
            short_leave_limit_type: type.short_leave_limit_type || 'month',
            short_leave_limit: type.short_leave_limit || 0,
            short_leave_time_minutes: type.short_leave_time_minutes || 0,
        });
    };

    const handleDelete = () => {
        if (confirmDelete) {
            Inertia.delete(`/leave-type/${confirmDelete.id}`, {
                onSuccess: () => setConfirmDelete(null),
            });
        }
    };

    const startAssign = (type: LeaveType) => {
        setAssigningType(type);
        setAssignDays(type.days_per_year);
        setSelectedStaffs([]); // Default none checked
        setSearchStaff('');
        setAutoCalculate(true);
    };

    const handleSelectAllToggle = () => {
        if (selectedStaffs.length === employees.length) {
            setSelectedStaffs([]);
        } else {
            setSelectedStaffs(employees.map((s: Staff) => s.id));
        }
    };

    const handleStaffCheckboxChange = (id: number) => {
        setSelectedStaffs(prev => 
            prev.includes(id) 
                ? prev.filter(item => item !== id) 
                : [...prev, id]
        );
    };

    const handleAssignSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!assigningType) return;
        setSubmittingAssign(true);

        const matrixPayload = selectedStaffs.map(staffId => ({
            employee_id: staffId,
            leave_type_id: assigningType.id,
            remaining_days: autoCalculate ? 0 : assignDays
        }));

        Inertia.post('/leave-balance/assign', {
            year: assignYear,
            auto_calculate: autoCalculate,
            matrix: matrixPayload
        }, {
            onFinish: () => {
                setSubmittingAssign(false);
                setAssigningType(null);
            }
        });
    };

    // Filter staff members based on search term
    const filteredStaffs = employees.filter((s: Staff) => 
        s.name.toLowerCase().includes(searchStaff.toLowerCase()) || 
        s.id.toString().includes(searchStaff) || 
        (s.staff_no && s.staff_no.toLowerCase().includes(searchStaff.toLowerCase()))
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12">
            
            {/* Form Section */}
            <div className="lg:col-span-1">
                <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 border-b border-slate-200">
                        <h3 className="text-base font-bold text-white tracking-wide">{editingType ? 'Modify' : 'Create'} Leave Type</h3>
                        <p className="text-slate-400 text-xs mt-0.5">Configure default leave limits per calendar year.</p>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        <div className="flex border-b border-slate-200 mb-4">
                            <button
                                type="button"
                                className={`px-4 py-2 text-sm font-bold border-b-2 transition ${!data.is_short_leave ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                onClick={() => setData('is_short_leave', false)}
                            >
                                General Leave
                            </button>
                            <button
                                type="button"
                                className={`px-4 py-2 text-sm font-bold border-b-2 transition ${data.is_short_leave ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                onClick={() => setData('is_short_leave', true)}
                            >
                                Short Leave
                            </button>
                        </div>

                        {!data.is_short_leave ? (
                            <div className="space-y-5 animate-in fade-in zoom-in duration-200">
                                <InputField
                                    label="Leave Type Name"
                                    placeholder="e.g. Annual Leave, Sick Leave"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    error={errors.name}
                                    required
                                />
                                
                                <InputField
                                    label="Default Days Per Year"
                                    type="number"
                                    placeholder="e.g. 14, 21"
                                    value={data.days_per_year}
                                    onChange={e => setData('days_per_year', parseInt(e.target.value) || 0)}
                                    error={errors.days_per_year}
                                    required
                                />

                                <TextareaField
                                    label="Remarks / Comment"
                                    placeholder="Any additional notes or comments regarding this leave type..."
                                    rows={3}
                                    value={data.comment}
                                    onChange={e => setData('comment', e.target.value)}
                                    error={errors.comment}
                                />

                                <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200/60 mt-4">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Leave Calculation Rules</h4>
                                    
                                    <label className="flex items-start gap-2.5 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={data.applies_sl_joining_rules}
                                            onChange={e => setData('applies_sl_joining_rules', e.target.checked)}
                                            className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20"
                                        />
                                        <div>
                                            <span className="block text-xs font-bold text-slate-800">Applies Sri Lankan Leave Law</span>
                                            <span className="block text-[10px] text-slate-400">Pro-rata in Year 2, 0 days in Year 1 based on employee's join date.</span>
                                        </div>
                                    </label>

                                    <label className="flex items-start gap-2.5 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={data.applies_probation_half_rate}
                                            onChange={e => setData('applies_probation_half_rate', e.target.checked)}
                                            className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20"
                                        />
                                        <div>
                                            <span className="block text-xs font-bold text-slate-800">Applies Sri Lankan Casual Leave Rules</span>
                                            <span className="block text-[10px] text-slate-400">Accrues 0.5 days per completed month in the first calendar year.</span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-5 animate-in fade-in zoom-in duration-200">
                                <InputField
                                    label="Leave Type Name"
                                    placeholder="e.g. Short Leave"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    error={errors.name}
                                    required
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-1">
                                        <label className="block text-sm font-medium text-gray-700">Limit Type</label>
                                        <select
                                            value={data.short_leave_limit_type}
                                            onChange={e => setData('short_leave_limit_type', e.target.value)}
                                            className="mt-1 block w-full border rounded-md shadow-sm p-2 border-gray-300 focus:border-green-500 focus:ring-green-500 text-sm"
                                        >
                                            <option value="month">Per Month</option>
                                            <option value="week">Per Week</option>
                                        </select>
                                    </div>
                                    <InputField
                                        containerClassName="col-span-1"
                                        label="Total Limit"
                                        type="number"
                                        value={data.short_leave_limit}
                                        onChange={e => setData('short_leave_limit', parseInt(e.target.value) || 0)}
                                        error={errors.short_leave_limit}
                                        placeholder="e.g. 2"
                                    />
                                    <InputField
                                        containerClassName="col-span-2"
                                        label="Duration (Minutes)"
                                        type="number"
                                        value={data.short_leave_time_minutes}
                                        onChange={e => setData('short_leave_time_minutes', parseInt(e.target.value) || 0)}
                                        error={errors.short_leave_time_minutes}
                                        placeholder="e.g. 90 (for 1.5 hours)"
                                    />
                                </div>
                                <TextareaField
                                    label="Remarks / Comment"
                                    placeholder="Any additional notes or comments regarding this leave type..."
                                    rows={3}
                                    value={data.comment}
                                    onChange={e => setData('comment', e.target.value)}
                                    error={errors.comment}
                                />
                            </div>
                        )}
                        
                        <div className="flex gap-3 pt-2 border-t border-slate-100">
                            {editingType && (
                                <Button 
                                    variant="secondary"
                                    onClick={() => { setEditingType(null); reset(); }} 
                                    className="flex-1 px-4 py-2"
                                >
                                    Cancel
                                </Button>
                            )}
                            <Button
                                type="submit"
                                loading={processing}
                                loadingText="Saving..."
                                className="flex-1"
                            >
                                {editingType ? 'Update Policy' : 'Create Type'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            {/* List / Table Section */}
            <div className="lg:col-span-2">
                <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 border-b border-slate-200">
                        <h3 className="text-base font-bold text-white tracking-wide">Configured Leave Policies</h3>
                        <p className="text-slate-400 text-xs mt-0.5">Manage default annual limits available to staff assignment.</p>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Leave Policy Name</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Default Duration</th>
                                    <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Management Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {leaveTypes.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-10 text-center text-sm text-slate-400 italic">No leave types configured. Add one on the left to get started.</td>
                                    </tr>
                                ) : (
                                    leaveTypes.map((type: LeaveType) => (
                                        <tr key={type.id} className="hover:bg-slate-50/60 transition">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                                                <div>{type.name}</div>
                                                <div className="flex flex-wrap gap-1.5 mt-1">
                                                    {type.deleted_at && (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-800 border border-rose-200 uppercase tracking-wider">
                                                            Archived (Deleted)
                                                        </span>
                                                    )}
                                                    {type.applies_sl_joining_rules && (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                                                            Sri Lankan Law
                                                        </span>
                                                    )}
                                                    {type.applies_probation_half_rate && (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800 border border-blue-200 uppercase tracking-wider">
                                                            SL Casual Rules
                                                        </span>
                                                    )}
                                                    {type.is_short_leave && (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 uppercase tracking-wider">
                                                            Short Leave ({type.short_leave_limit} / {type.short_leave_limit_type})
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                                                {type.is_short_leave ? `${type.short_leave_time_minutes} Mins / Req` : `${Number(type.days_per_year)} Days / Year`}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                
                                                {/* Bulk Assign Trigger */}
                                                {!type.deleted_at && (
                                                    <button 
                                                        onClick={() => startAssign(type)} 
                                                        className="text-emerald-600 hover:text-emerald-800 p-1.5 rounded-md hover:bg-emerald-50 transition active:scale-95 inline-flex items-center justify-center focus:outline-none"
                                                        title="Assign Policy to Employees"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                                                        </svg>
                                                    </button>
                                                )}

                                                {!type.deleted_at && (
                                                    <button 
                                                        onClick={() => startEdit(type)} 
                                                        className="text-teal-600 hover:text-teal-800 p-1.5 rounded-md hover:bg-teal-50 transition active:scale-95 inline-flex items-center justify-center focus:outline-none"
                                                        title="Edit Leave Policy"
                                                    >
                                                        <PencilIcon className="h-5 w-5" />
                                                    </button>
                                                )}
                                                
                                                {!type.deleted_at ? (
                                                    <button 
                                                        onClick={() => setConfirmDelete(type)} 
                                                        className="text-rose-600 hover:text-rose-800 p-1.5 rounded-md hover:bg-rose-50 transition active:scale-95 inline-flex items-center justify-center focus:outline-none"
                                                        title="Delete Leave Policy"
                                                    >
                                                        <TrashIcon className="h-5 w-5" />
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={() => Inertia.post(`/leave-type/${type.id}/restore`)}
                                                        className="text-blue-600 hover:text-blue-800 p-1.5 rounded-md hover:bg-blue-50 transition active:scale-95 inline-flex items-center justify-center focus:outline-none"
                                                        title="Restore Leave Policy"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Standard Delete Modal */}
            <ConfirmationModal
                isOpen={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={handleDelete}
                title="Delete Leave Type"
            >
                Are you sure you want to delete leave type "<strong>{confirmDelete?.name}</strong>"?
            </ConfirmationModal>

            {/* Premium Bulk Assign Modal */}
            {assigningType && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in duration-150">
                        
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 text-white border-b border-slate-200">
                            <h3 className="text-base font-bold tracking-wide">Assign Policy: {assigningType.name}</h3>
                            <p className="text-slate-400 text-xs mt-0.5">Bulk allocate {assigningType.name} parameters to selected staff members.</p>
                        </div>

                        <form onSubmit={handleAssignSubmit} className="flex-1 flex flex-col overflow-hidden">
                            {/* Scrollable Form Body */}
                            <div className="p-6 space-y-5 overflow-y-auto max-h-[60vh]">
                                
                                {/* Dynamic Calculation Checkbox */}
                                <label className="flex items-start gap-2.5 cursor-pointer bg-slate-50 p-3 rounded-lg border border-slate-200 select-none">
                                    <input
                                        type="checkbox"
                                        checked={autoCalculate}
                                        onChange={e => setAutoCalculate(e.target.checked)}
                                        className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20 cursor-pointer"
                                    />
                                    <div>
                                        <span className="block text-xs font-bold text-slate-800">Calculate dynamically using join date</span>
                                        <span className="block text-[10px] text-slate-400">
                                            Determines entitlement dynamically for each employee using Sri Lanka Leave Law or Probation rules if configured on this leave type.
                                        </span>
                                    </div>
                                </label>

                                {/* Year and Allowance Inputs */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Calendar Year</label>
                                        <input 
                                            type="number"
                                            value={assignYear}
                                            onChange={e => setAssignYear(parseInt(e.target.value) || new Date().getFullYear())}
                                            className="w-full text-sm font-bold border-slate-200 focus:border-teal-500 focus:ring-teal-500/20 rounded-lg transition"
                                            min={2020}
                                            max={2100}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Default Days to Assign</label>
                                        <input 
                                            type="number"
                                            value={assignDays}
                                            onChange={e => setAssignDays(parseFloat(e.target.value) || 0)}
                                            className={`w-full text-sm font-bold border-slate-200 focus:border-teal-500 focus:ring-teal-500/20 rounded-lg transition ${autoCalculate ? 'bg-slate-100 cursor-not-allowed text-slate-400' : ''}`}
                                            step="0.5"
                                            min="0"
                                            disabled={autoCalculate}
                                            required={!autoCalculate}
                                        />
                                    </div>
                                </div>

                                {/* Employee Checklist Section */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Select Active Employees</label>
                                        <button 
                                            type="button"
                                            onClick={handleSelectAllToggle}
                                            className="text-xs font-bold text-teal-600 hover:text-teal-800 transition"
                                        >
                                            {selectedStaffs.length === employees.length ? 'Deselect All' : 'Select All'}
                                        </button>
                                    </div>

                                    {/* Search Bar inside Checklist */}
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                            <MagnifyingGlassIcon className="h-4 w-4" />
                                        </span>
                                        <input 
                                            type="text" 
                                            placeholder="Search by name or employee ID..."
                                            className="w-full pl-9 pr-4 py-2 text-sm border-slate-200 focus:border-teal-500 focus:ring-teal-500/20 rounded-lg transition"
                                            value={searchStaff}
                                            onChange={e => setSearchStaff(e.target.value)}
                                        />
                                    </div>

                                    {/* Checklist Container */}
                                    <div className="border border-slate-200 rounded-lg max-h-48 overflow-y-auto divide-y divide-slate-100 bg-slate-50/50">
                                        {filteredStaffs.length === 0 ? (
                                            <div className="px-4 py-6 text-center text-sm text-slate-400 italic">
                                                No matching active employees found.
                                            </div>
                                        ) : (
                                            filteredStaffs.map((staff: Staff) => {
                                                const isSelected = selectedStaffs.includes(staff.id);
                                                return (
                                                    <label 
                                                        key={staff.id}
                                                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-100/65 cursor-pointer transition"
                                                    >
                                                        <input 
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => handleStaffCheckboxChange(staff.id)}
                                                            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500/20 border-slate-300 rounded cursor-pointer"
                                                        />
                                                        <div>
                                                            <div className="text-sm font-bold text-slate-900 leading-none">{staff.name}</div>
                                                            <div className="text-[10px] text-slate-400 font-semibold mt-0.5">{staff.staff_no || staff.id}</div>
                                                        </div>
                                                    </label>
                                                );
                                            })
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium">
                                        Selected: <strong>{selectedStaffs.length}</strong> of <strong>{employees.length}</strong> employees.
                                    </p>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3 shrink-0">
                                <Button 
                                    variant="secondary"
                                    onClick={() => setAssigningType(null)}
                                    type="button"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    loading={submittingAssign}
                                    loadingText="Assigning..."
                                    disabled={selectedStaffs.length === 0}
                                >
                                    Assign to {selectedStaffs.length} Employees
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeaveTypesPage;
