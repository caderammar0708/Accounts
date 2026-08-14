import React, { useState, useRef, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import SidebarIcon from './SidebarIcon';

export default function Sidebar({ navigation, user, onQuickMenuOpen }) {
    const scrollContainerRef = useRef(null);

    const getInitialOpenMenu = () => {
        if (typeof window === 'undefined') return 'reports';
        const stored = sessionStorage.getItem('sidebar_open_menu');
        if (stored !== null) {
            return stored === 'null' ? null : stored;
        }

        const currentUrl = window.location.href;
        const currentPath = window.location.pathname;

        const matchesPath = (href) => {
            if (!href) return false;
            if (href.startsWith('http://') || href.startsWith('https://')) {
                return currentUrl.startsWith(href) || href.includes(currentPath);
            }
            return currentPath.startsWith(href) || href.startsWith(currentPath);
        };

        return null;
    };

    const [openMenu, setOpenMenu] = useState(getInitialOpenMenu);

    useEffect(() => {
        sessionStorage.setItem('sidebar_open_menu', openMenu === null ? 'null' : openMenu);
    }, [openMenu]);

    useEffect(() => {
        const savedScrollPosition = sessionStorage.getItem('sidebar_scroll_position');
        if (savedScrollPosition && scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = parseInt(savedScrollPosition, 10);

            // Just in case elements haven't fully rendered or settled yet
            const timeoutId = setTimeout(() => {
                if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollTop = parseInt(savedScrollPosition, 10);
                }
            }, 50);
            return () => clearTimeout(timeoutId);
        }
    }, []);

    const handleScroll = (e) => {
        sessionStorage.setItem('sidebar_scroll_position', e.target.scrollTop);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Sidebar Branding */}
            <div className="px-6 pt-6 pb-4 border-b border-slate-800/50">
                <div className="flex items-center gap-3 group">
                    <div className="rounded-xl bg-white/10 border border-white/20 transition-all flex items-center justify-center overflow-hidden w-9 h-9">
                        <ApplicationLogo className="h-8 w-auto filter invert brightness-200" type="icon" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-white text-sm font-black tracking-tight leading-none">JBooks</span>
                    </div>
                </div>
            </div>

            {/* Quick Action Button (QuickBooks Style) */}
            <div className="px-6 py-2">
                <button
                    onClick={onQuickMenuOpen}
                    className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-[#00713D] text-white font-bold text-[11px] rounded-lg hover:bg-[#005a30] transition-all shadow-sm group uppercase tracking-wider"
                >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
                    </svg>
                    Create New
                </button>
            </div>

            {/* Navigation Groups */}
            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-3 py-6 space-y-6 scrollbar-hide custom-scrollbar"
            >
                {/* Main Links */}
                <div>
                    <h3 className="px-3 mb-3 text-2xs font-bold text-slate-600 uppercase tracking-[.2em]">Menu</h3>
                    <div className="space-y-0.5">
                        {navigation.map((item) => {
                            const routeName = item.href ? item.href.split('/').pop() : '';
                            const isActive = (item.activePattern && Array.isArray(item.activePattern) && item.activePattern.some(pattern => route().current(pattern))) ||
                                (item.name === 'Dashboard' && route().current('dashboard')) ||
                                (routeName && (route().current(`${routeName}.*`) || route().current(routeName) || route().current(`${routeName}.index`)));

                            return (!item.adminOnly || user.role === 'admin') && (
                                <Link
                                    key={`${item.name}-${item.href}`}
                                    href={item.href}
                                    onClick={item.onClick ? item.onClick : undefined}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group ${
                                        (item.activeRoutes ? item.activeRoutes.some(r => route().current(r)) : (route().current(item.href.split('/').pop()) || (item.name === 'Dashboard' && route().current('dashboard'))))
                                        ? 'bg-[#00713D] text-white shadow-md shadow-[#00713D]/20'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md transition-colors ${
                                        (item.activeRoutes ? item.activeRoutes.some(r => route().current(r)) : route().current() === item.href) 
                                        ? 'text-white' 
                                        : 'group-hover:text-white'
                                        }`}>
                                        <SidebarIcon name={item.icon} />
                                    </span>
                                    <span className="text-xs font-bold leading-none whitespace-nowrap">{item.name}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Bottom Footer Section */}
            <div className="p-3">
                <div className="bg-slate-800/10 rounded-xl p-2.5 border border-slate-800 transition-all group">
                    <div className="relative z-10 flex items-center justify-center">
                        <span className="text-[9px] font-bold text-white uppercase tracking-wider">JobAlign Software Solutions</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
