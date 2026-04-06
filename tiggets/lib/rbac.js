import { cookies } from 'next/headers';
import clientPromise from '@/lib/mongodb';

// 1. Define your valid roles (Single Source of Truth)
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  CUSTOMER: 'customer',
};

// 2. Define Route Permissions
// Maps which roles are allowed to visit which paths
export const ROUTE_PERMISSIONS = {
  '/dashboard': [ROLES.ADMIN, ROLES.MANAGER, ROLES.CUSTOMER],
  '/profile': [ROLES.ADMIN, ROLES.MANAGER, ROLES.CUSTOMER],
  '/settings': [ROLES.ADMIN, ROLES.MANAGER, ROLES.CUSTOMER],
  '/system-logs': [ROLES.ADMIN],
  '/user-management': [ROLES.ADMIN, ROLES.MANAGER],
  '/tickets': [ROLES.ADMIN, ROLES.MANAGER, ROLES.CUSTOMER],
};

// 3. Centralized Session Verifier
// We moved this out of your dashboard/page.tsx into here so ANY page can use it.
export async function getCurrentSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');

  if (!sessionCookie) return null;

  try {
    const client = await clientPromise;
    const db = client.db('TicketingSystem');
    
    const session = await db.collection('sessions').findOne({ 
      sessionId: sessionCookie.value 
    });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    return {
      userId: session.userId,
      role: session.role.toLowerCase(),
    };
  } catch (error) {
    console.error('RBAC Session Error:', error);
    return null;
  }
}

// 4. Centralized Authorization Check
export default function isAuthorized(userRole, currentPath) {
  const normalizedRole = String(userRole || '').toLowerCase();
  const normalizedPath = normalizePathForAuthorization(currentPath);

  // If the path isn't strictly defined, default to closed (Fail Securely)
  const allowedRoles = ROUTE_PERMISSIONS[normalizedPath];
  if (!allowedRoles) return false;
  
  return allowedRoles.includes(normalizedRole);
}

export function normalizePathForAuthorization(pathname) {
  const rawPath = String(pathname || '').trim();
  if (!rawPath || rawPath === '/') return '/';

  const pathOnly = rawPath.split('?')[0].replace(/\/+$/, '') || '/';

  if (pathOnly === '/dashboard' || pathOnly.startsWith('/dashboard/')) return '/dashboard';
  if (pathOnly === '/profile' || pathOnly.startsWith('/profile/')) return '/profile';
  if (pathOnly === '/settings' || pathOnly.startsWith('/settings/')) return '/settings';
  if (pathOnly === '/tickets' || pathOnly.startsWith('/tickets/')) return '/tickets';
  if (pathOnly === '/user-management' || pathOnly.startsWith('/user-management/')) return '/user-management';
  if (pathOnly === '/system-logs' || pathOnly.startsWith('/system-logs/')) return '/system-logs';

  return pathOnly;
}