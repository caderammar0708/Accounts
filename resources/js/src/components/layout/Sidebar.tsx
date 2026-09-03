
import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    ChartBarIcon,
    CurrencyDollarIcon,
    ShieldCheckIcon,
    ChevronDownIcon,
    PlusIcon,
    BriefcaseIcon,
    CalendarIcon,
} from '../icons/Icons';

type NavItem = {
    name: string;
    icon: React.FC<{ className?: string }>;
    href?: string;
    permission?: string;
    children?: {
        name: string;
        href: string;
        permission?: string;
    }[];
}

const navigation: NavItem[] = [
    { name: 'Holiday Calendar', href: '/calendar', icon: CalendarIcon, permission: 'manage-leave-requests' },
    { name: 'Dashboard', href: '/dashboard', icon: ChartBarIcon },
    {
        name: 'HR',
        icon: BriefcaseIcon,
        permission: 'manage-hr',
        children: [
            { name: 'Departments', href: '/department', permission: 'manage-departments' },
            { name: 'Designations', href: '/designation', permission: 'manage-designations' },
            { name: 'Shifts', href: '/shift', permission: 'manage-shifts' },
            { name: 'Staffs', href: '/staff', permission: 'manage-staff' },
            { name: 'Leave Types', href: '/leave-type', permission: 'manage-leave-types' },
        ]
    },
    {
        name: 'Payroll & Leave',
        icon: CurrencyDollarIcon,
        permission: 'manage-payroll',
        children: [
            { name: 'Payroll', href: '/payroll', permission: 'view-payroll' },
            { name: 'Salary Operations', href: '/salary-revision', permission: 'manage-payroll' },
            { name: 'Leaves', href: '/leave-request', permission: 'manage-leave-requests' },
            { name: 'Approvals', href: '/approvals', permission: 'manage-system' },
            { name: 'Attendance', href: '/attendance', permission: 'view-attendance-report' },
        ]
    },
    {
        name: 'Admin',
        icon: ShieldCheckIcon,
        permission: 'manage-system',
        children: [
            { name: 'Users', href: '/user', permission: 'manage-users' },
            { name: 'System Backups', href: '/system-backups', permission: 'manage-backups' },
            { name: 'Settings', href: '/settings', permission: 'manage-company-profile' },
            { name: 'Action Logs', href: '/action-logs', permission: 'view-action-logs' },
        ]
    },
];

interface SidebarProps {
    isCollapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setCollapsed }) => {
    const { url, props } = usePage();
    const { auth, company } = props as any;
    const permissions = auth?.permissions || [];
    const isSuperAdmin = auth?.is_super_admin || auth?.roles?.includes('super-admin');

    const hasPermission = (permission?: string) => {
        if (!permission || isSuperAdmin) return true;
        return permissions.includes(permission);
    };

    const filteredNavigation = navigation
        .filter(item => hasPermission(item.permission))
        .map(item => {
            if (item.children) {
                return {
                    ...item,
                    children: item.children.filter(child => hasPermission(child.permission))
                };
            }
            return item;
        })
        .filter(item => !item.children || item.children.length > 0);

    const [openMenu, setOpenMenu] = useState<string | null>(() => {
        const currentParent = filteredNavigation.find(item =>
            item.children?.some(child => url.startsWith(child.href))
        );
        return currentParent?.name || null;
    });

    const handleMenuToggle = (name: string) => {
        setOpenMenu(openMenu === name ? null : name);
    };

    return (
        <div className={`flex flex-col bg-[#232A30] text-gray-300 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
            {/* Header */}
            <div className={`flex items-center h-16 px-4 border-b border-gray-700 ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
                <img src="/assets/images/logo-icon.png" className="h-12 w-12" />
                {!isCollapsed && <span className="ml-3 text-xl font-bold text-white">JobAlign</span>}
            </div>

            <div className="p-4 hidden">
            </div>

            {/* Navigation */}
            <nav className={`flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar`}>
                {filteredNavigation.map((item) => (
                    item.children ? (
                        <div key={item.name} className="relative group">
                            <button
                                onClick={() => !isCollapsed && handleMenuToggle(item.name)}
                                className={`flex items-center w-full px-3 py-2 text-sm font-medium text-left rounded-md hover:bg-gray-700 hover:text-white focus:outline-none transition-colors ${isCollapsed ? 'justify-center' : 'justify-between'}`}
                            >
                                <span className="flex items-center">
                                    <item.icon className={`h-6 w-6 text-gray-400 ${!isCollapsed ? 'mr-3' : ''}`} />
                                    {!isCollapsed && <span>{item.name}</span>}
                                </span>
                                {!isCollapsed && <ChevronDownIcon className={`h-5 w-5 transform transition-transform duration-150 ${openMenu === item.name ? 'rotate-180' : ''}`} />}
                            </button>

                            {/* Collapsed view flyout menu */}
                            {isCollapsed && (
                                <div className="absolute left-full top-0 ml-2 hidden group-hover:block w-56 bg-[#232A30] border border-gray-700 rounded-md shadow-lg py-2 z-50">
                                    <div className="px-4 py-2 text-sm font-semibold text-white">{item.name}</div>
                                    <div className="border-t border-gray-700 mx-2 my-1"></div>
                                    {item.children.map(child => (
                                        <Link
                                            key={child.name}
                                            href={child.href}
                                            className={`block px-4 py-2 text-sm font-medium rounded-md mx-2 transition duration-150 ${url.startsWith(child.href)
                                                ? 'text-white bg-gradient-to-r from-emerald-600 to-teal-700 shadow-sm font-semibold'
                                                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                                }`}
                                        >
                                            {child.name}
                                        </Link>
                                    ))}
                                </div>
                            )}

                            {/* Expanded view dropdown */}
                            {openMenu === item.name && !isCollapsed && (
                                <div className="pl-9 mt-1 space-y-1">
                                    {item.children.map(child => (
                                        <Link
                                            key={child.name}
                                            href={child.href}
                                            className={`block px-3 py-2 text-sm font-medium rounded-md transition duration-150 ${url.startsWith(child.href)
                                                ? 'text-white bg-gradient-to-r from-emerald-600 to-teal-700 shadow-sm font-semibold'
                                                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                                }`}
                                        >
                                            {child.name}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link
                            key={item.name}
                            href={item.href!}
                            className={`group relative flex items-center px-3 py-2 text-sm font-medium rounded-md transition duration-150 ${isCollapsed ? 'justify-center' : ''} ${item.name === 'Holiday Calendar'
                                ? (url === item.href! || url.startsWith(item.href!)
                                    ? 'text-white bg-gradient-to-r from-teal-600 to-emerald-600 shadow-sm font-semibold border border-teal-500 mb-2'
                                    : 'text-teal-400 bg-teal-950/40 hover:bg-teal-900/30 hover:text-teal-300 border border-teal-800/50 font-semibold mb-2')
                                : (url === item.href! || (item.href! !== '/' && url.startsWith(item.href!))
                                    ? 'text-white bg-gradient-to-r from-emerald-600 to-teal-700 shadow-sm font-semibold'
                                    : 'text-gray-300 hover:bg-gray-700 hover:text-white')
                                }`}
                        >
                            <item.icon className={`h-6 w-6 ${item.name === 'Holiday Calendar' && !url.startsWith(item.href!) ? 'text-teal-400' : 'text-gray-400'} ${!isCollapsed ? 'mr-3' : ''}`} />
                            {!isCollapsed && <span>{item.name}</span>}
                            {isCollapsed && (
                                <span className="absolute left-full ml-2 hidden group-hover:block whitespace-nowrap bg-gray-800 text-white text-xs rounded py-1 px-2 z-20 pointer-events-none">
                                    {item.name}
                                </span>
                            )}
                        </Link>
                    )
                ))}
            </nav>
            <div className="p-4 border-t border-gray-700">
                {!isCollapsed && (
                    <div className="text-center text-xs text-gray-400">
                        <p>v1.0.0 &copy; {new Date().getFullYear()}</p>
                        <a
                            href="https://growdigitec.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-white hover:underline"
                        >
                            Growdigitec
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Sidebar;
