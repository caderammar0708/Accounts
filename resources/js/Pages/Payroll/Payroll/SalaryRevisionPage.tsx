import React, { useState } from 'react';
import { usePage, Page } from '@inertiajs/react';
import { PageProps } from '@/src/types';
import moment from 'moment';

interface SalaryRevision {
    id: number;
    employee_id: string;
    old_basic_salary: number;
    new_basic_salary: number;
    old_allowances: any[];
    new_allowances: any[];
    old_deductions: any[];
    new_deductions: any[];
    changed_by: string;
    created_at: string;
    staff?: {
        name: string;
    };
}

const SalaryRevisionPage: React.FC = () => {
    const { revisions = [], company, auth } = usePage<Page<PageProps>>().props as any;
    const [expandedRow, setExpandedRow] = useState<number | null>(null);

    const prefix = company?.currency_prefix || auth?.currency?.prefix || 'LKR';

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-sm font-bold text-slate-800 tracking-tight">Historical Salary Revisions</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Audit log of all modifications made to basic salaries, allowances, and statutory parameters.</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date & Time</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Employee</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Old Basic ({prefix})</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">New Basic ({prefix})</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Difference</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Changed By</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Details</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {revisions.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-xs font-medium">
                                        No salary revisions recorded yet. Revisions are created automatically when changing employee structures.
                                    </td>
                                </tr>
                            ) : (
                                revisions.map((rev: SalaryRevision) => {
                                    const diff = rev.new_basic_salary - rev.old_basic_salary;
                                    const isExpanded = expandedRow === rev.id;
                                    return (
                                        <React.Fragment key={rev.id}>
                                            <tr className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-3.5 whitespace-nowrap text-xs text-slate-500">
                                                    {moment(rev.created_at).format('YYYY-MM-DD hh:mm A')}
                                                </td>
                                                <td className="px-6 py-3.5 whitespace-nowrap">
                                                    <div className="text-xs font-bold text-slate-900">{rev.staff?.name ?? 'N/A'}</div>
                                                    <div className="text-2xs text-slate-400 font-mono">{rev.employee_id}</div>
                                                </td>
                                                <td className="px-6 py-3.5 whitespace-nowrap text-xs font-mono text-right font-medium text-slate-500">
                                                    {prefix} {rev.old_basic_salary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-6 py-3.5 whitespace-nowrap text-xs font-mono text-right font-bold text-slate-900">
                                                    {prefix} {rev.new_basic_salary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-6 py-3.5 whitespace-nowrap text-xs font-mono text-center">
                                                    {diff === 0 ? (
                                                        <span className="text-slate-400 font-medium">No Change</span>
                                                    ) : diff > 0 ? (
                                                        <span className="text-primary font-bold">&Delta; +{prefix} {diff.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                    ) : (
                                                        <span className="text-rose-600 font-bold">&nabla; -{prefix} {Math.abs(diff).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-3.5 whitespace-nowrap text-xs text-slate-600 font-medium">
                                                    {rev.changed_by}
                                                </td>
                                                <td className="px-6 py-3.5 whitespace-nowrap text-right text-xs">
                                                    <button 
                                                        onClick={() => setExpandedRow(isExpanded ? null : rev.id)}
                                                        className="text-primary hover:text-primary-600 font-bold text-xs transition-colors focus:outline-none"
                                                    >
                                                        {isExpanded ? 'Hide Details' : 'View Changes'}
                                                    </button>
                                                </td>
                                            </tr>

                                            {/* Details Expandable Box */}
                                            {isExpanded && (
                                                <tr className="bg-slate-50/70 border-t border-b border-slate-100">
                                                    <td colSpan={7} className="px-6 py-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                                            {/* Allowances comparison */}
                                                            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
                                                                <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-2 flex justify-between">
                                                                    <span>Allowances Changes</span>
                                                                    <span className="text-slate-400 font-normal">Active items comparison</span>
                                                                </h4>
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <span className="block font-semibold text-slate-400 mb-1">Old Allowances</span>
                                                                        {rev.old_allowances && rev.old_allowances.length > 0 ? (
                                                                            <ul className="space-y-1">
                                                                                {rev.old_allowances.map((a: any, i: number) => (
                                                                                    <li key={i} className="text-slate-600 font-mono">{a.name}: {prefix} {parseFloat(a.amount).toLocaleString()}</li>
                                                                                ))}
                                                                            </ul>
                                                                        ) : (
                                                                            <span className="text-slate-400 italic">None</span>
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <span className="block font-semibold text-primary mb-1">New Allowances</span>
                                                                        {rev.new_allowances && rev.new_allowances.length > 0 ? (
                                                                            <ul className="space-y-1">
                                                                                {rev.new_allowances.map((a: any, i: number) => (
                                                                                    <li key={i} className="text-slate-800 font-bold font-mono">{a.name}: {prefix} {parseFloat(a.amount).toLocaleString()}</li>
                                                                                ))}
                                                                            </ul>
                                                                        ) : (
                                                                            <span className="text-slate-400 italic">None</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Deductions comparison */}
                                                            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
                                                                <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-2 flex justify-between">
                                                                    <span>Deductions Changes</span>
                                                                    <span className="text-slate-400 font-normal">Active items comparison</span>
                                                                </h4>
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <span className="block font-semibold text-slate-400 mb-1">Old Deductions</span>
                                                                        {rev.old_deductions && rev.old_deductions.length > 0 ? (
                                                                            <ul className="space-y-1">
                                                                                {rev.old_deductions.map((d: any, i: number) => (
                                                                                    <li key={i} className="text-slate-600 font-mono">{d.name}: {prefix} {parseFloat(d.amount).toLocaleString()}</li>
                                                                                ))}
                                                                            </ul>
                                                                        ) : (
                                                                            <span className="text-slate-400 italic">None</span>
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <span className="block font-semibold text-rose-600 mb-1">New Deductions</span>
                                                                        {rev.new_deductions && rev.new_deductions.length > 0 ? (
                                                                            <ul className="space-y-1">
                                                                                {rev.new_deductions.map((d: any, i: number) => (
                                                                                    <li key={i} className="text-slate-800 font-bold font-mono">{d.name}: {prefix} {parseFloat(d.amount).toLocaleString()}</li>
                                                                                ))}
                                                                            </ul>
                                                                        ) : (
                                                                            <span className="text-slate-400 italic">None</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SalaryRevisionPage;
