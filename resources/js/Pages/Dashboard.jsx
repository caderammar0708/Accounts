import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
} from 'recharts';
import { formatCurrency } from '@/Utils/currencyFormat';

export default function Dashboard({ auth, metrics, trendData, lowStockItems, recentJobs }) {
    return (
        <AuthenticatedLayout user={auth.user} header="Dashboard">
            <Head title="Dashboard" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-4 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[9px] font-semibold uppercase tracking-[0.35em] text-slate-500 mb-1">Today's Jobs</p>
                                <p className="text-2xl font-black text-slate-900 leading-tight">{metrics.todays_jobs}</p>
                            </div>
                            <div className="h-10 w-10 rounded-2xl bg-primary-50 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined text-sm">build</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-4 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[9px] font-semibold uppercase tracking-[0.35em] text-slate-500 mb-1">Pending Jobs</p>
                                <p className="text-2xl font-black text-slate-900 leading-tight">{metrics.pending_jobs}</p>
                            </div>
                            <div className="h-10 w-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
                                <span className="material-symbols-outlined text-sm">pending_actions</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-4 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[9px] font-semibold uppercase tracking-[0.35em] text-slate-500 mb-1">Today's Revenue</p>
                                <p className="text-2xl font-black text-slate-900 leading-tight">{formatCurrency(metrics.todays_revenue)}</p>
                            </div>
                            <div className="h-10 w-10 rounded-2xl bg-green-50 flex items-center justify-center text-green-600">
                                <span className="material-symbols-outlined text-sm">payments</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-4 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[9px] font-semibold uppercase tracking-[0.35em] text-slate-500 mb-1">Monthly Revenue</p>
                                <p className="text-2xl font-black text-slate-900 leading-tight">{formatCurrency(metrics.monthly_revenue)}</p>
                            </div>
                            <div className="h-10 w-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <span className="material-symbols-outlined text-sm">trending_up</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-4 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[9px] font-semibold uppercase tracking-[0.35em] text-slate-500 mb-1">Monthly Expenses</p>
                                <p className="text-2xl font-black text-slate-900 leading-tight">{formatCurrency(metrics.monthly_expenses)}</p>
                            </div>
                            <div className="h-10 w-10 rounded-2xl bg-red-50 flex items-center justify-center text-red-600">
                                <span className="material-symbols-outlined text-sm">trending_down</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-4 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[9px] font-semibold uppercase tracking-[0.35em] text-slate-500 mb-1">Monthly Profit</p>
                                <p className={`text-2xl font-black leading-tight ${metrics.monthly_profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {formatCurrency(metrics.monthly_profit)}
                                </p>
                            </div>
                            <div className="h-10 w-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5 mb-8">
                        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">7-Day Revenue / Expense Trend</h3>
                                <p className="text-sm text-slate-500">A quick view of daily revenue and expense performance.</p>
                            </div>
                        </div>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={trendData}
                                    margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                                >
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#16a34a" stopOpacity={0.25} />
                                            <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#dc2626" stopOpacity={0.25} />
                                            <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <YAxis
                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                        axisLine={false}
                                        tickLine={false}
                                        width={40}
                                        allowDecimals={false}
                                        domain={['dataMin', 'dataMax']}
                                    />
                                    <Tooltip
                                        cursor={{ stroke: '#cbd5e1', strokeDasharray: '3 3' }}
                                        contentStyle={{ borderRadius: '12px', padding: '10px', borderColor: '#e2e8f0', backgroundColor: 'white' }}
                                        formatter={(value) => [formatCurrency(value), 'Amount']}
                                    />
                                    <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingBottom: 10 }} />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        name="Revenue"
                                        stroke="#16a34a"
                                        fill="url(#colorRevenue)"
                                        strokeWidth={2}
                                        dot={{ r: 3 }}
                                        activeDot={{ r: 5 }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="expense"
                                        name="Expense"
                                        stroke="#dc2626"
                                        fill="url(#colorExpense)"
                                        strokeWidth={2}
                                        dot={{ r: 3 }}
                                        activeDot={{ r: 5 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Recent Jobs */}
                        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                                <h3 className="font-bold text-slate-800">Recent Job Registrations</h3>
                                <Link href={route('job-cards.index')} className="text-sm text-primary hover:text-primary-700">View All</Link>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {recentJobs.length > 0 ? recentJobs.map(job => (
                                    <div key={job.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                                        <div>
                                            <Link href={route('job-cards.show', job.id)} className="font-bold text-slate-900 hover:text-primary">#{job.job_card_number}</Link>
                                            <p className="text-sm text-slate-500">{job.customer?.display_name} - {job.device?.model}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-800">{job.status}</span>
                                            <p className="text-xs text-slate-400 mt-1">{new Date(job.service_date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-8 text-center text-slate-500">No recent jobs found.</div>
                                )}
                            </div>
                        </div>

                        {/* Low Stock Alerts */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-4 border-b border-slate-200 bg-slate-50">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-orange-500 text-sm">warning</span>
                                    Low Stock Alerts
                                </h3>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {lowStockItems.length > 0 ? lowStockItems.map(item => (
                                    <div key={item.id} className="p-4 flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-800">{item.name}</span>
                                        <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-md">{item.quantity_on_hand} left</span>
                                    </div>
                                )) : (
                                    <div className="p-8 text-center text-slate-500 text-sm">Stock levels are good.</div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
