import React, { useState, useRef, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import SidebarIcon from './SidebarIcon';
import { can } from '@/Utils/permissions';

export default function Sidebar({ navigation, user, onQuickMenuOpen }) {
    const scrollContainerRef = useRef(null);
    const { url } = usePage();

    const isSubmenuActive = (sub) => {
        if (!sub) return false;

        // 1. Check Ziggy route activeRoutes
        if (sub.activeRoutes && Array.isArray(sub.activeRoutes)) {
            if (sub.activeRoutes.some(r => {
                try { return route().current(r); } catch (e) { return false; }
            })) return true;
        }

        // 2. Check activePattern
        if (sub.activePattern && Array.isArray(sub.activePattern)) {
            if (sub.activePattern.some(pattern => {
                try { return route().current(pattern); } catch (e) { return false; }
            })) return true;
        }

        // 3. Check route name inferred from href
        const subRouteName = sub.href ? sub.href.split('?')[0].split('/').filter(Boolean).pop() : '';
        if (subRouteName) {
            try {
                if (route().current(`${subRouteName}.*`) || route().current(subRouteName) || route().current(`${subRouteName}.index`)) {
                    return true;
                }
            } catch (e) {}
        }

        // 4. URL path matching
        if (url && sub.href) {
            try {
                const currentPath = url.split('?')[0];
                const subPath = new URL(sub.href, typeof window !== 'undefined' ? window.location.origin : 'http://localhost').pathname;
                if (currentPath === subPath || (subPath !== '/' && currentPath.startsWith(subPath))) {
                    return true;
                }
            } catch (e) {
                if (url.startsWith(sub.href)) return true;
            }
        }

        return false;
    };

    const [expandedMenus, setExpandedMenus] = useState(() => {
        const initial = {};
        if (navigation) {
            navigation.forEach(item => {
                if (item.submenus && item.submenus.some(sub => isSubmenuActive(sub))) {
                    initial[item.name] = true;
                }
            });
        }
        return initial;
    });

    // Automatically expand parent whenever navigating to a page matching any child submenu
    useEffect(() => {
        setExpandedMenus(prev => {
            const next = { ...prev };
            if (navigation) {
                navigation.forEach(item => {
                    if (item.submenus && item.submenus.some(sub => isSubmenuActive(sub))) {
                        next[item.name] = true;
                    }
                });
            }
            return next;
        });
    }, [url, navigation]);

    const toggleSubmenu = (menuName, hasActive) => {
        setExpandedMenus(prev => {
            const currentVal = prev[menuName] !== undefined ? prev[menuName] : hasActive;
            return {
                ...prev,
                [menuName]: !currentVal
            };
        });
    };

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
                <Link href={route('dashboard')} className="flex items-center gap-3 group">
                    <div className="rounded-xl bg-white/10 border border-white/20 transition-all flex items-center justify-center overflow-hidden w-9 h-9 group-hover:bg-white/20">
                        <ApplicationLogo className="h-8 w-auto filter invert brightness-200" type="icon" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-white text-sm font-black tracking-tight leading-none group-hover:text-white/90">JBooks</span>
                    </div>
                </Link>
            </div>

            {/* Quick Action Button (QuickBooks Style) */}
            <div className="px-6 py-2">
                <button
                    onClick={onQuickMenuOpen}
                    className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-primary text-white font-bold text-[11px] rounded-lg hover:bg-primary-600 transition-all shadow-sm group uppercase tracking-wider"
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
                            const isActive = (item.activeRoutes && Array.isArray(item.activeRoutes) && item.activeRoutes.some(r => route().current(r))) ||
                                (item.activePattern && Array.isArray(item.activePattern) && item.activePattern.some(pattern => route().current(pattern))) ||
                                (item.name === 'Dashboard' && route().current('dashboard')) ||
                                (routeName && (route().current(`${routeName}.*`) || route().current(routeName) || route().current(`${routeName}.index`)));

                            const hasAccess = item.permission ? can(user, item.permission) : (!item.adminOnly || can(user, 'dashboard.view'));

                            if (!hasAccess) return null;

                            if (item.submenus) {
                                const hasActiveSubmenu = item.submenus.some(sub => isSubmenuActive(sub));
                                const isExpanded = expandedMenus[item.name] !== undefined ? expandedMenus[item.name] : hasActiveSubmenu;
                                
                                return (
                                    <div key={item.name} className="space-y-1">
                                        <button
                                            onClick={() => toggleSubmenu(item.name, hasActiveSubmenu)}
                                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 group ${
                                                hasActiveSubmenu || isExpanded
                                                ? 'bg-white/10 text-white font-bold'
                                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md transition-colors ${hasActiveSubmenu || isExpanded ? 'text-white' : 'group-hover:text-white'}`}>
                                                    <SidebarIcon name={item.icon} />
                                                </span>
                                                <span className="text-xs font-bold leading-none whitespace-nowrap">{item.name}</span>
                                            </div>
                                            <svg className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                        
                                        {isExpanded && (
                                            <div className="pl-11 pr-3 space-y-1 mt-1">
                                                {item.submenus.map((sub, idx) => {
                                                    const isSubActive = isSubmenuActive(sub);
                                                    const hasSubAccess = sub.permission ? can(user, sub.permission) : true;
                                                    
                                                    return hasSubAccess && (
                                                        <Link
                                                            key={`${sub.name}-${idx}`}
                                                            href={sub.href}
                                                            className={`flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${
                                                                isSubActive
                                                                ? 'text-white font-bold bg-white/5'
                                                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                                            }`}
                                                        >
                                                            <span className="text-[11px] font-semibold leading-none">{sub.name}</span>
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            return (
                                <Link
                                    key={`${item.name}-${item.href}`}
                                    href={item.href}
                                    onClick={item.onClick ? item.onClick : undefined}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group ${
                                        isActive
                                        ? 'bg-white/10 text-white font-bold'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md transition-colors ${
                                        isActive 
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
