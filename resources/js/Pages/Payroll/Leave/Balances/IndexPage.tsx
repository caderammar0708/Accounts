import React, { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { usePageHeader } from '@/src/App';

import { MagnifyingGlassIcon } from '@/src/components/icons/Icons';

interface LeaveBalance {
    id: number;
    employee_id: string;
    leave_type_id: number;
    year: number;
    remaining_days: number;
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
}

interface BalancesPageProps {
    balances: LeaveBalance[];
    employees: Staff[];
    leaveTypes: LeaveType[];
}

const LeaveBalancesPage: React.FC = () => {
    const { balances, employees, leaveTypes } = usePage<Page<PageProps>>().props as any as BalancesPageProps;
    const { setTitle, setActions } = usePageHeader();

    const [year, setYear] = useState<number>(new Date().getFullYear());
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [matrix, setMatrix] = useState<Record<string, any>>({});

    // Sync matrix state based on loaded balances for the selected year
    useEffect(() => {
        const initialMatrix: Record<string, any> = {};
        balances.forEach(b => {
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

    useEffect(() => {
        setTitle('Leave Balances Grid');
        setActions(
            <div className="flex gap-2.5">
                <a 
                    href="/leave-balance/export" 
                    className="flex items-center justify-center px-8 py-2.5 text-sm font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200/80 shadow-sm transition duration-150 active:scale-[0.98]"
                >
                    Export to Excel
                </a>
            </div>
        );
        return () => setActions(undefined);
    }, [setTitle, setActions]);

    // Filter staff members based on search term
    const filteredStaffs = employees.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.staff_no?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-12">
            
            {/* Header Toolbar Selection */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <MagnifyingGlassIcon className="h-4 w-4" />
                    </span>
                    <input 
                        type="text" 
                        placeholder="Search employee by name or ID..."
                        className="w-full pl-9 pr-4 py-2 text-sm border-slate-200 focus:border-teal-500 focus:ring-teal-500/20 rounded-lg transition"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Calendar Year Selector */}
                <div className="flex items-center gap-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Calendar Year:</label>
                    <input 
                        type="number"
                        className="w-28 text-sm font-bold border-slate-200 focus:border-teal-500 focus:ring-teal-500/20 rounded-lg text-center"
                        value={year}
                        onChange={e => setYear(parseInt(e.target.value) || new Date().getFullYear())}
                        min={2020}
                        max={2100}
                    />
                </div>
            </div>

            {/* Balances Spreadsheet Matrix Grid */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                
                {/* Modern Slate Header Banner */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <div>
                        <h3 className="text-base font-bold text-white tracking-wide">Employee Leave Balances Grid</h3>
                        <p className="text-slate-400 text-xs mt-0.5">Overview of active staff leave allocations and remaining balances. (Shown as: Taken / Entitlement)</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 table-fixed">
                        <thead className="bg-slate-50">
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
                                    <td colSpan={1 + leaveTypes.length} className="px-6 py-10 text-center text-sm text-slate-400 italic">
                                        No active staff members found.
                                    </td>
                                </tr>
                            ) : (
                                filteredStaffs.map(staff => (
                                    <tr key={staff.id} className="hover:bg-slate-50/50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap text-left">
                                            <div className="text-sm font-bold text-slate-950 leading-tight">{staff.name}</div>
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
                                                            ? 'text-teal-700 bg-teal-50 border-teal-200' 
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
};

export default LeaveBalancesPage;
