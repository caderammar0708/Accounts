import { Link } from '@inertiajs/react';

export default function Pagination({ links, classNames = '' }) {
    if (!links || links.length <= 3) return null;

    return (
        <div className={`flex items-center justify-center gap-1 ${classNames}`}>
            {links.map((link, idx) => (
                <Link
                    key={idx}
                    href={link.url || '#'}
                    className={`px-3 py-1 text-xs border rounded-md transition-colors ${
                        link.active 
                            ? 'bg-slate-900 text-white border-slate-900' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    } ${!link.url ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                    preserveState 
                    preserveScroll
                />
            ))}
        </div>
    );
}
