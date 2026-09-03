import React, { useState, useRef, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { useAuth, usePageHeader } from '@/src/App';
import { Cog6ToothIcon, BellIcon, ArrowRightOnRectangleIcon, MagnifyingGlassIcon, MenuIcon, UsersIcon } from '../icons/Icons';

interface HeaderProps {
  setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

const Header: React.FC<HeaderProps> = ({ setSidebarCollapsed }) => {
  const { title, actions } = usePageHeader();
  const { user } = useAuth();
  const { props } = usePage();
  const { auth } = props as any;
  const permissions = auth?.permissions || [];
  const isSuperAdmin = auth?.is_super_admin || auth?.roles?.includes('super-admin');
  const hasSettingsPermission = isSuperAdmin || permissions.includes('manage-company-profile');

  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="flex justify-between items-center px-6 bg-white border-b border-gray-200 h-16 shrink-0">
      <div className="flex items-center space-x-4">
        <button onClick={() => setSidebarCollapsed(prev => !prev)} className="text-gray-500 hover:text-gray-800">
          <MenuIcon className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
      </div>

      <div className="flex items-center space-x-5">
        {actions}
        <div className="flex items-center space-x-5 text-gray-500 pl-4 border-l">
          {hasSettingsPermission && (
            <Link href="/settings" className="hover:text-gray-800 transition-colors" title="Settings">
              <Cog6ToothIcon className="h-6 w-6" />
            </Link>
          )}
          <button className="hover:text-gray-700"><BellIcon className="h-6 w-6" /></button>
        </div>

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button onClick={() => setDropdownOpen(!isDropdownOpen)} className="flex items-center space-x-2.5 hover:opacity-90 transition focus:outline-none">
            <span className="text-xs font-bold text-slate-700 hidden sm:block">{user?.name}</span>
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-emerald-600 to-teal-700 flex items-center justify-center text-white font-bold shadow-sm border border-emerald-500/20 select-none">
              {user?.name.charAt(0) ?? 'A'}
            </div>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 border border-gray-200">
              <div className="px-4 py-2">
                <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.role}</p>
              </div>
              <div className="border-t border-gray-200"></div>
              <Link
                href="/profile"
                className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setDropdownOpen(false)}
              >
                <UsersIcon className="h-5 w-5 mr-2" />
                My Profile
              </Link>
              <Link
                href="/logout"
                method="post"
                as="button"
                className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setDropdownOpen(false)}
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                Logout
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
