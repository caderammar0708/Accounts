
import React from 'react';
import { Link, usePage } from '@inertiajs/react';

export interface TabItem {
    label: string;
    href: string;
}

interface TabsProps {
    tabs: TabItem[];
}

const Tabs: React.FC<TabsProps> = ({ tabs }) => {
    const { url } = usePage();

    // A more robust check for the active tab, handling the base edit page case
    const isCurrentTab = (tabHref: string) => {
        if (url === tabHref) return true;
        // The base URL for personal info is shorter, so it shouldn't match longer URLs
        if (tabHref.split('/').length > url.split('/').length) return false;
        
        return url.startsWith(tabHref) && (url.length === tabHref.length || url[tabHref.length] === '/');
    };

    return (
        <div className="border-b border-gray-200 overflow-x-auto no-scrollbar">
            <nav className="-mb-px flex space-x-6 px-4" aria-label="Tabs">
                {tabs.map(tab => (
                    <Link
                        key={tab.label}
                        href={tab.href}
                        className={`
                            ${isCurrentTab(tab.href)
                                ? 'border-green-500 text-green-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }
                            shrink-0 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                        `}
                    >
                        {tab.label}
                    </Link>
                ))}
            </nav>
        </div>
    );
};

export default Tabs;
