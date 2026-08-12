import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import CommonButton from '@/Components/CommonButton';
import { useState } from 'react';
import SlideOver from '@/Components/SlideOver';
import CommonInput from '@/Components/CommonInput';
import ContactsTabs from '@/Components/ContactsTabs';

export default function EmployeeIndex({ employees = [] }) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const { data, setData, post, patch, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        name: '',
        email: '',
        designation: '',
        salary: '',
        join_date: '',
    });

    const handleOpenCreate = () => {
        setIsEdit(false);
        setSelectedId(null);
        reset();
        clearErrors();
        setIsCreateOpen(true);
    };

    const handleEdit = (employee) => {
        setIsEdit(true);
        setSelectedId(employee.id);
        setData({
            name: employee.name || employee.user?.name || '',
            email: employee.email || employee.user?.email || '',
            designation: employee.designation || '',
            salary: employee.salary || '',
            join_date: employee.join_date || '',
        });
        setIsCreateOpen(true);
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to remove this employee?')) {
            destroy(route('employees.destroy', id));
        }
    };

    const submit = (e) => {
        e.preventDefault();
        if (isEdit) {
            patch(route('employees.update', selectedId), {
                onSuccess: () => {
                    setIsCreateOpen(false);
                    reset();
                },
            });
        } else {
            post(route('employees.store'), {
                onSuccess: () => {
                    setIsCreateOpen(false);
                    reset();
                },
            });
        }
    };

    const filteredEmployees = employees.filter(emp => 
        (emp.name || emp.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        emp.designation?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-bold text-lg text-slate-800 tracking-tight">Employees</h2>
            }
        >
            <Head title="Employees" />
            
            <div className="p-6">
                <ContactsTabs />
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* Toolbar */}
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                            <input 
                                type="text" 
                                placeholder="Find an employee..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-1.5 border border-slate-300 rounded-md text-[11px] w-full focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                            />
                        </div>

                        <CommonButton
                            variant="primary"
                            onClick={handleOpenCreate}
                        >
                            New employee
                        </CommonButton>
                    </div>
                    {/* Employee Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200">
                                <th className="px-4 py-2.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest w-2/5">Employee</th>
                                <th className="px-4 py-2.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Designation</th>
                                <th className="px-4 py-2.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">Salary</th>
                                <th className="px-4 py-2.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">Join Date</th>
                                <th className="px-4 py-2.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300">
                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                            </div>
                                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">No employees found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredEmployees.map((employee) => (
                                    <tr key={employee.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-primary-700 font-black text-xs shrink-0">
                                                    {(employee.name || employee.user?.name || '?').charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 leading-tight group-hover:text-primary-600 transition-colors">{employee.name || employee.user?.name}</div>
                                                    <div className="text-[10px] text-slate-400">{employee.email || employee.user?.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2">
                                            <span className="font-bold text-slate-700">
                                                {employee.designation}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-right font-bold text-slate-900 tabular-nums">
                                            {employee.salary ? `${employee.currency_prefix || ''} ${parseFloat(employee.salary).toLocaleString()}` : '-'}
                                        </td>
                                        <td className="px-4 py-2 text-right font-medium text-slate-500 text-[11px] uppercase">
                                            {employee.join_date || '-'}
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(employee)}
                                                    className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-all"
                                                >
                                                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(employee.id)}
                                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                                                >
                                                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    </div>
                </div>
            </div>

            <SlideOver 
                isOpen={isCreateOpen} 
                onClose={() => setIsCreateOpen(false)}
                title={isEdit ? "Edit Employee" : "New Employee"}
            >
                <form onSubmit={submit} className="space-y-6">
                    <CommonInput 
                        label="Full Name" 
                        value={data.name} 
                        onChange={e => setData('name', e.target.value)} 
                        required
                        error={errors.name}
                    />
                    <CommonInput 
                        label="Email Address" 
                        type="email"
                        value={data.email} 
                        onChange={e => setData('email', e.target.value)} 
                        required
                        error={errors.email}
                    />
                    <CommonInput 
                        label="Designation" 
                        value={data.designation} 
                        onChange={e => setData('designation', e.target.value)} 
                        required
                        error={errors.designation}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <CommonInput 
                            label="Salary" 
                            type="number"
                            value={data.salary} 
                            onChange={e => setData('salary', e.target.value)} 
                            error={errors.salary}
                        />
                        <CommonInput 
                            label="Join Date" 
                            type="date"
                            value={data.join_date} 
                            onChange={e => setData('join_date', e.target.value)} 
                            error={errors.join_date}
                        />
                    </div>


                    <div className="pt-6 flex items-center justify-end gap-3 border-t border-slate-100">
                        <CommonButton variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</CommonButton>
                        <CommonButton variant="primary" type="submit" processing={processing}>
                            {isEdit ? "Update Employee" : "Save Employee"}
                        </CommonButton>
                    </div>
                </form>
            </SlideOver>
        </AuthenticatedLayout>
    );
}
