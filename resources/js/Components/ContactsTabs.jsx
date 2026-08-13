import React from 'react';
import { Link } from '@inertiajs/react';

export default function ContactsTabs() {
    return (
        <div className="border-b border-slate-200 mb-6 px-6 pt-2">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <Link 
                    href={route('customers.index')} 
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${route().current('customers.*') ? 'border-[#00713D] text-[#00713D]' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                >
                    Customers
                </Link>
                <Link 
                    href={route('suppliers.index')} 
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${route().current('suppliers.*') ? 'border-[#00713D] text-[#00713D]' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                >
                    Suppliers
                </Link>
                <Link 
                    href={route('employees.index')} 
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${route().current('employees.*') ? 'border-[#00713D] text-[#00713D]' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                >
                    Employees
                </Link>
            </nav>
        </div>
    );
}
