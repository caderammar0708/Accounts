import { Link, usePage } from '@inertiajs/react';

export default function StationTabs() {
    const { url } = usePage();

    const tabs = [
        { name: 'Tanks', href: route('tanks.index'), current: url.startsWith('/tanks') },
        { name: 'Pumps & Nozzles', href: route('pumps.index'), current: url.startsWith('/pumps') },
        { name: 'Dip Readings', href: route('tank-dip-readings.index'), current: url.startsWith('/tank-dip-readings') },
    ];

    return (
        <div className="mb-6 border-b border-slate-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                {tabs.map((tab) => (
                    <Link
                        key={tab.name}
                        href={tab.href}
                        className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-bold text-xs uppercase tracking-widest transition-colors
                            ${tab.current
                                ? 'border-[#00713D] text-[#00713D]'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }
                        `}
                        aria-current={tab.current ? 'page' : undefined}
                    >
                        {tab.name}
                    </Link>
                ))}
            </nav>
        </div>
    );
}
