import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import { usePage, Link, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import QuickActionMenu from '@/Components/QuickActionMenu';
import MoreOptionsMenu from '@/Components/MoreOptionsMenu';
import ToastNotification from '@/Components/ToastNotification';
import QuickAddPayee from '@/Components/QuickAddPayee';
import QuickAddAccount from '@/Components/QuickAddAccount';
import InventoryItemSidePanel from '@/Components/InventoryItemSidePanel';
import Sidebar from './Partials/Sidebar';
import Modal from '@/Components/Modal';
import axios from 'axios';
import SwitchCompanyModal from '@/Components/SwitchCompanyModal';
import { can } from '@/Utils/permissions';
import CommonButton from '@/Components/CommonButton';

export default function AuthenticatedLayout({ header, children, hideSidebar = false }) {
    const page = usePage();
    const shouldHideSidebar = hideSidebar;
    const user = page.props.auth.user;
    const currentPath = page.url || window.location.pathname;

    const moreOptions = (() => {
        if (currentPath.startsWith('/customers/')) {
            return { copyRoute: 'customers.create', deleteRoute: 'customers.destroy', recordId: page.props.customer?.id, listRoute: 'customers.index' };
        }
        if (currentPath.startsWith('/suppliers/')) {
            return { copyRoute: 'suppliers.create', deleteRoute: 'suppliers.destroy', recordId: page.props.supplier?.id, listRoute: 'suppliers.index' };
        }
        if (currentPath.startsWith('/items/')) {
            return { copyRoute: 'items.create', deleteRoute: 'items.destroy', recordId: page.props.item?.id, listRoute: 'items.index' };
        }
        if (currentPath.startsWith('/chart-of-account/')) {
            return { copyRoute: 'chart-of-account.create', deleteRoute: 'chart-of-account.destroy', recordId: page.props.chartOfAccount?.id, listRoute: 'chart-of-account.index' };
        }
        return null;
    })();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);
    const [quickAddType, setQuickAddType] = useState(null);
    const [isSwitchCompanyModalOpen, setIsSwitchCompanyModalOpen] = useState(false);
    const [locations, setLocations] = useState([]);

    useEffect(() => {
        if (page.props.auth.location) {
            axios.get(route('api.locations'))
                .then(res => setLocations(res.data))
                .catch(err => console.error("Error fetching locations", err));
        }
    }, [page.props.auth.location]);

    const businessType = page.props.auth.business_type || 'Normal';
    const isFuelStation = businessType === 'Fuel Station';
    const isServiceStation = businessType === 'Service Station';
    const isDealership = businessType === 'Dealership';
    const isNormal = businessType === 'Normal';

    const showLocationsAndStockShifts = isDealership || (isNormal && Boolean(page.props.auth.location));

    const navigation = [
        { name: 'Dashboard', href: route('dashboard'), icon: 'dashboard', permission: 'dashboard.view' },
        ...(page.props.auth.pos_layout_enabled ? [{ name: 'POS Billing', href: route('pos.index'), icon: 'pos', isPos: true, permission: 'sales-invoices.create' }] : []),
        {
            name: 'Contacts',
            href: route('customers.index'),
            icon: 'users',
            permission: ['customers.view', 'suppliers.view', 'employees.view'],
            activePattern: ['customers.*', 'suppliers.*', 'employees.*'],
            activeRoutes: ['customers.*', 'suppliers.*', 'employees.*']
        },
        ...(isServiceStation ? [{ name: 'Vehicles', href: route('vehicles.index'), icon: 'vehicle', permission: 'warranties.view' }] : []),
        ...(isServiceStation ? [{ name: 'Jobs', href: route('job-cards.index'), icon: 'job', isJob: true, permission: 'warranties.view' }] : []),
        ...(isServiceStation ? [{ name: 'Warranties', href: route('warranties.index'), icon: 'warranty', isWarranty: true, permission: 'warranties.view' }] : []),
        ...(isFuelStation ? [{ name: 'Shifts', href: route('shifts.index'), icon: 'team', permission: 'shifts.view' }] : []),
        ...(showLocationsAndStockShifts ? [{ name: 'Stock Shifts', href: route('stock-shifts.index'), icon: 'team', activeRoutes: ['stock-shifts.*'] }] : []),
        { name: 'Products & Services', href: route('items.index'), icon: 'inventory', permission: 'items.view' },
        ...(isFuelStation ? [
            { name: 'Pump Setup', href: route('tanks.index'), icon: 'pump', permission: 'shifts.view', activeRoutes: ['tanks.*', 'pumps.*'] },
        ] : []),
        { name: 'Chart of Accounts', href: route('chart-of-account.index'), icon: 'accounting', permission: 'chart-of-accounts.view' },
        { name: 'Reports', href: route('reports.index'), icon: 'reports', permission: 'reports.view' },
        ...(showLocationsAndStockShifts ? [{ name: 'Locations', href: route('locations.index'), icon: 'locations', activeRoutes: ['locations.*'] }] : []),
        { name: 'Import Tools', href: route('import.index'), icon: 'import_tools', permission: 'import.view', activeRoutes: ['import.*'] },
        { name: 'Bank Reconciliation', href: route('bank-reconciliation.index'), icon: 'reconciliation', permission: 'bank-reconciliation.view' },
    ];

    return (
        <div className={`bg-[#f8fafc] ${shouldHideSidebar ? 'h-screen overflow-hidden flex flex-col' : 'min-h-screen'}`}>
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 lg:hidden px-4 py-6 bg-slate-900/60 backdrop-blur-sm transition-opacity print:hidden" onClick={() => setSidebarOpen(false)}>
                    <div className="fixed inset-y-0 left-0 w-56 bg-slate-900 shadow-2xl print:hidden" onClick={e => e.stopPropagation()}>
                        <Sidebar
                            navigation={navigation}
                            user={user}
                            onQuickMenuOpen={() => {
                                setSidebarOpen(false);
                                setIsQuickMenuOpen(true);
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Desktop Sidebar */}
            {isSidebarVisible && !shouldHideSidebar && (
                <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-56 print:hidden">
                    <div className="flex flex-col w-full bg-slate-900 border-r border-slate-800 shadow-2xl print:hidden">
                        <Sidebar
                            navigation={navigation}
                            user={user}
                            onQuickMenuOpen={() => setIsQuickMenuOpen(true)}
                        />
                    </div>
                </div>
            )}

            <div className={`transition-all duration-300 ease-in-out ${isSidebarVisible && !shouldHideSidebar ? 'lg:pl-56' : ''} print:pl-0 ${shouldHideSidebar ? 'flex-1 flex flex-col min-h-0' : ''}`}>
                {/* Header / Top Bar */}
                <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-md px-4 sm:px-6 print:hidden">
                    <div className="flex items-center gap-3">
                        <CommonButton variant="custom" size="none"
                            onClick={() => isSidebarVisible ? setSidebarOpen(true) : setIsSidebarVisible(true)}
                            className="p-1.5 text-slate-500 hover:bg-slate-50 rounded-lg lg:hidden"
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </CommonButton>

                        {!shouldHideSidebar && (
                            <div className="hidden lg:flex items-center gap-2">
                                <CommonButton variant="custom" size="none"
                                    onClick={() => setIsSidebarVisible(!isSidebarVisible)}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                    title={isSidebarVisible ? "Collapse Sidebar" : "Expand Sidebar"}
                                >
                                    <svg className={`h-4 w-4 transition-transform duration-300 ${isSidebarVisible ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                    </svg>
                                </CommonButton>

                                {!isSidebarVisible && (
                                    <CommonButton variant="custom" size="none"
                                        type="button"
                                        onClick={() => setIsQuickMenuOpen(true)}
                                        title="Create New"
                                        className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary hover:bg-primary-600 text-white shadow-sm hover:shadow transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 group"
                                    >
                                        <svg className="h-4 w-4 transition-transform group-hover:rotate-90 duration-150" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                                        </svg>
                                    </CommonButton>
                                )}
                            </div>
                        )}

                        {shouldHideSidebar && (
                            <ApplicationLogo className="h-7 w-auto" />
                            // {hideSidebar && (
                            //     <Link href={route('dashboard')} className="flex items-center">
                            //         <ApplicationLogo className="h-7 w-auto hover:opacity-80 transition-opacity" />
                            //     </Link>
                        )}

                        <div className="h-5 w-px bg-slate-200 hidden sm:block mx-1" />

                        {header && (
                            <div className="font-bold text-slate-800 tracking-tight text-sm">{header}</div>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        {moreOptions && (
                            <MoreOptionsMenu
                                copyRoute={moreOptions.copyRoute}
                                deleteRoute={moreOptions.deleteRoute}
                                recordId={moreOptions.recordId}
                                listRoute={moreOptions.listRoute}
                            />
                        )}


                        {/* POS Billing Shortcut */}
                        {page.props.auth.pos_layout_enabled && (
                            <Link href={route('pos.index')} className="p-2 text-slate-400 hover:text-primary hover:bg-primary-50 rounded-full transition-colors relative" title="POS Billing">
                                <span className="material-symbols-outlined text-[20px] leading-none block">point_of_sale</span>
                            </Link>
                        )}

                        {/* warranties Billing Shortcut */}
                        {isServiceStation && (
                            <Link href={route('warranties.index')} className="p-2 text-slate-400 hover:text-primary hover:bg-primary-50 rounded-full transition-colors relative" title="warranties Billing">
                                <span className="material-symbols-outlined text-[20px] leading-none block">shield</span>
                            </Link>
                        )}

                        {/* job Shortcut */}
                        {isServiceStation && (
                            <Link href={route('job-cards.index')} className="p-2 text-slate-400 hover:text-primary hover:bg-primary-50 rounded-full transition-colors relative" title="Job Registrations">
                                <span className="material-symbols-outlined text-[20px] leading-none block">work</span>
                            </Link>
                        )}

                        {/* Notifications (Mock) */}
                        <CommonButton variant="custom" size="none" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors relative">
                            <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-primary-500 border-2 border-white" />
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        </CommonButton>

                        {/* Settings */}
                        {(user?.is_admin || can(user, ['settings.company', 'settings.print', 'import.view', 'users.view', 'roles.view'])) && (
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <CommonButton variant="custom" size="none" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors relative">
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    </CommonButton>
                                </Dropdown.Trigger>
                                <Dropdown.Content align="right" width="48" contentClasses="py-1 bg-white ring-1 ring-black ring-opacity-5 rounded-xl shadow-xl overflow-hidden mt-2">
                                    {(user?.is_admin || can(user, 'settings.company')) && (
                                        <Dropdown.Link href={route('settings.company')}>Company Settings</Dropdown.Link>
                                    )}
                                    {(user?.is_admin || can(user, 'settings.print')) && (
                                        <Dropdown.Link href={route('settings.print')}>Print Settings</Dropdown.Link>
                                    )}
                                    {(user?.is_admin || can(user, 'import.view')) && (
                                        <Dropdown.Link href={route('import.index')}>Import Tools</Dropdown.Link>
                                    )}
                                    {(user?.is_admin || can(user, 'users.view')) && (
                                        <Dropdown.Link href={route('users.index')}>User Management</Dropdown.Link>
                                    )}
                                    {(user?.is_admin || can(user, 'roles.view')) && (
                                        <Dropdown.Link href={route('roles.index')}>Roles & Permissions</Dropdown.Link>
                                    )}
                                </Dropdown.Content>
                            </Dropdown>
                        )}

                        {/* Branch Switcher / Location Indicator */}
                        {page.props.auth.location && locations && locations.length > 0 && (
                            <div className="flex items-center">
                                {page.props.auth.location.is_locked ? (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                                        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <span>{page.props.auth.location.current?.name || 'Branch'}</span>
                                    </div>
                                ) : (
                                    <Dropdown>
                                        <Dropdown.Trigger>
                                            <CommonButton variant="custom" size="none" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors">
                                                <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                <span>{page.props.auth.location.current?.name || 'Select Branch'}</span>
                                                <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </CommonButton>
                                        </Dropdown.Trigger>

                                        <Dropdown.Content align="right" width="48" contentClasses="py-1 bg-white ring-1 ring-black ring-opacity-5 rounded-xl shadow-xl overflow-hidden mt-2">
                                            <div className="px-3 py-1.5 text-2xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                                                Switch Branch
                                            </div>
                                            {locations.map((loc) => (
                                                <CommonButton variant="custom" size="none"
                                                    key={loc.id}
                                                    onClick={() => router.post(route('locations.switch'), { location_id: loc.id })}
                                                    className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${page.props.auth.location.current_id === loc.id ? 'font-bold text-primary bg-green-50/50' : 'text-slate-700'
                                                        }`}
                                                >
                                                    <span>{loc.name}</span>
                                                    {loc.code && <span className="text-2xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{loc.code}</span>}
                                                </CommonButton>
                                            ))}
                                        </Dropdown.Content>
                                    </Dropdown>
                                )}
                            </div>
                        )}

                        {/* User Profile Dropdown */}
                        <Dropdown>
                            <Dropdown.Trigger>
                                <CommonButton variant="custom" size="none" className="flex items-center justify-center p-1 rounded-full hover:bg-slate-50 transition-all duration-300">
                                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold ring-2 ring-green-50 shadow-sm shrink-0">
                                        {user.name[0]}
                                    </div>
                                </CommonButton>
                            </Dropdown.Trigger>

                            <Dropdown.Content align="right" width="48" contentClasses="py-1 bg-white ring-1 ring-black ring-opacity-5 rounded-xl shadow-xl overflow-hidden mt-2">
                                <div className="px-4 py-2 border-b border-slate-50">
                                    <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
                                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5 truncate">{user.email}</p>
                                </div>
                                <Dropdown.Link href={route('profile.edit')} className="text-slate-600 hover:text-slate-900 hover:bg-slate-50 px-4 py-2.5 text-sm transition-colors">My Profile</Dropdown.Link>
                                <CommonButton variant="custom" size="none"
                                    type="button"
                                    onClick={() => setIsSwitchCompanyModalOpen(true)}
                                    className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                                >
                                    Switch Company
                                </CommonButton>
                                <Dropdown.Link href={route('logout')} method="post" as="button" className="w-full text-left text-red-600 hover:bg-red-50 px-4 py-2.5 text-sm transition-colors border-t border-slate-50">Log Out</Dropdown.Link>
                            </Dropdown.Content>
                        </Dropdown>
                    </div>
                </header>

                {/* Page Content */}
                <main className={`relative z-0 ${shouldHideSidebar ? 'flex-1 flex overflow-hidden min-h-0' : 'min-h-[calc(100vh-64px)]'}`}>
                    {children}
                </main>
            </div>

            <QuickActionMenu
                isOpen={isQuickMenuOpen}
                onClose={() => setIsQuickMenuOpen(false)}
                onOpenQuickAdd={(type) => {
                    setIsQuickMenuOpen(false);
                    setQuickAddType(type);
                }}
            />

            <QuickAddPayee
                isOpen={quickAddType === 'customer' || quickAddType === 'supplier'}
                onClose={() => setQuickAddType(null)}
                initialType={quickAddType === 'customer' ? 'customer' : 'supplier'}
            />

            <QuickAddAccount
                isOpen={quickAddType === 'account'}
                onClose={() => setQuickAddType(null)}
            />

            <InventoryItemSidePanel
                isOpen={quickAddType === 'item'}
                onClose={() => setQuickAddType(null)}
                onSuccess={() => setQuickAddType(null)}
            />

            <SwitchCompanyModal
                isOpen={isSwitchCompanyModalOpen}
                onClose={() => setIsSwitchCompanyModalOpen(false)}
            />

            <ToastNotification />
        </div>
    );
}


