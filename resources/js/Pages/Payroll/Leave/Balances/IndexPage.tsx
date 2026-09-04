import React, { useState, useEffect } from 'react';
import { usePage, Page } from '@inertiajs/react';
import { MagnifyingGlassIcon } from '@/src/components/icons/Icons';
import CommonButton from '@/Components/CommonButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

interface LeaveBalance {
    id: number;
    employee_id: string;
    leave_type_id: number;
    year: number;
    remaining_days: number;
    taken_days?: number;
    entitlement?: number;
    staff?: {
        name: string;
        id: number;
    };
    leave_type?: {
        name: string;
        days_per_year: number;
    };
}

interface LeaveType {
    id: number;
    name: string;
    days_per_year: number;
}

interface Staff {
    id: number;
    name: string;
    staff_no?: string;
}

interface BalancesPageProps {
    balances: LeaveBalance[];
    employees: Staff[];
    leaveTypes: LeaveType[];
}

interface Props {
    isEmbedded?: boolean;
}

const LeaveBalancesPage: React.FC<Props> = ({ isEmbedded = false }) => {
    const { balances = [], employees = [], leaveTypes = [] } = usePage<Page<BalancesPageProps>>().props as any;

    const [year, setYear] = useState<number>(new Date().getFullYear());
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [matrix, setMatrix] = useState<Record<string, any>>({});

    // Sync matrix state based on loaded balances for the selected year
    useEffect(() => {
        const initialMatrix: Record<string, any> = {};
        balances.forEach((b: LeaveBalance) => {
            if (b.year === year) {
                initialMatrix[`${b.employee_id}_${b.leave_type_id}`] = {
                    remaining: b.remaining_days,
                    taken: b.taken_days !== undefined ? b.taken_days : 0,
                    entitlement: b.entitlement !== undefined ? b.entitlement : (b.leave_type?.days_per_year || 0)
                };
            }
        });
        setMatrix(initialMatrix);
    }, [balances, year]);

    // Filter staff members based on search term
    const filteredStaffs = employees.filter((s: Staff) => 
        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.staff_no?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const content = (
        <div className="space-y-6">
            {/* Header Toolbar Selection */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <MagnifyingGlassIcon className="h-4 w-4" />
                    </span>
                    <input 
                        type="text" 
                        placeholder="Search employee by name or ID..."
                        className="w-full pl-9 pr-4 py-2 text-xs border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg transition"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Calendar Year Selector & Actions */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Year:</label>
                        <input 
                            type="number"
                            className="w-24 text-xs font-bold border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-center py-1.5"
                            value={year}
                            onChange={e => setYear(parseInt(e.target.value) || new Date().getFullYear())}
                            min={2020}
                            max={2100}
                        />
                    </div>
                    <CommonButton 
                        href="/leave-balance/export" 
                        variant="secondary"
                        size="sm"
                    >
                        Export to Excel
                    </CommonButton>
                </div>
            </div>

            {/* Balances Spreadsheet Matrix Grid */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Standard Card Header */}
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 tracking-tight">Employee Leave Balances Grid</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Overview of active staff leave allocations and remaining balances. (Shown as: Taken / Entitlement)</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 table-fixed">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="w-1/3 px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                                {leaveTypes.map(lt => (
                                    <th key={lt.id} className="px-6 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        <div>{lt.name}</div>
                                        <div className="text-[10px] text-slate-400 font-medium normal-case mt-0.5">(Max: {Number(lt.days_per_year)} days)</div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {filteredStaffs.length === 0 ? (
                                <tr>
                                    <td colSpan={1 + leaveTypes.length} className="px-6 py-12 text-center text-xs font-medium text-slate-400">
                                        No active staff members found.
                                    </td>
                                </tr>
                            ) : (
                                filteredStaffs.map(staff => (
                                    <tr key={staff.id} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-left">
                                            <div className="text-sm font-bold text-slate-900 leading-tight">{staff.name}</div>
                                            <div className="text-xs text-slate-400 font-semibold mt-0.5">{staff.staff_no}</div>
                                        </td>
                                        {leaveTypes.map(lt => {
                                            const valKey = `${staff.id}_${lt.id}`;
                                            const isAssigned = matrix[valKey] !== undefined;
                                            const val = isAssigned ? matrix[valKey] : null;

                                            return (
                                                <td key={lt.id} className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className={`inline-flex text-xs font-bold font-mono tracking-wider px-2.5 py-1 rounded-lg border ${
                                                        isAssigned 
                                                            ? 'text-primary bg-primary/10 border-primary/20' 
                                                            : 'text-slate-400 bg-slate-50 border-slate-200/60'
                                                    }`}>
                                                        {isAssigned ? `${Number(val.taken)} / ${Number(val.entitlement)}` : `0 / 0`}
                                                    </span>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    if (isEmbedded) {
        return content;
    }

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-bold text-lg text-slate-800 tracking-tight">
                    Leave Balances Grid
                </h2>
            }
        >
            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {content}
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default LeaveBalancesPage;

