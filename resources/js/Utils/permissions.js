import { usePage } from '@inertiajs/react';

/**
 * Check if the given user object has a specific permission
 * @param {Object} user - The auth.user object
 * @param {string|string[]} permission - The permission name or array of permission names
 * @returns {boolean}
 */
export function can(user, permission) {
    if (!user) return false;

    const permissions = Array.isArray(user.permissions) ? user.permissions : [];

    if (Array.isArray(permission)) {
        return permission.some(p => permissions.includes(p));
    }

    return permissions.includes(permission);
}

/**
 * Check if user has all specified permissions
 * @param {Object} user 
 * @param {string[]} permissionsList 
 * @returns {boolean}
 */
export function canAll(user, permissionsList) {
    if (!user) return false;
    const permissions = Array.isArray(user.permissions) ? user.permissions : [];
    return permissionsList.every(p => permissions.includes(p));
}

/**
 * Check if user has a specific role
 * @param {Object} user 
 * @param {string} roleName 
 * @returns {boolean}
 */
export function hasRole(user, roleName) {
    if (!user) return false;
    if (user.role === roleName) return true;
    const roles = Array.isArray(user.roles) ? user.roles : [];
    return roles.includes(roleName);
}

/**
 * Custom React hook for permission checks in components
 */
export function usePermission() {
    const { auth } = usePage().props;
    const user = auth?.user;

    return {
        user,
        can: (permission) => can(user, permission),
        canAll: (permissionsList) => canAll(user, permissionsList),
        hasRole: (roleName) => hasRole(user, roleName),
        isAdmin: user?.is_admin || user?.role === 'admin' || (user?.roles || []).includes('Admin'),
    };
}
