// hooks/useRBAC.ts
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types/auth';

interface RBACRules {
  [key: string]: {
    [key: string]: UserRole[];
  };
}

// Define RBAC rules for different routes and actions
const rbacRules: RBACRules = {
  expenses: {
    create: ['employee', 'manager', 'admin'],
    view: ['employee', 'manager', 'admin'],
    approve: ['manager', 'admin'],
    delete: ['admin'],
  },
  users: {
    view: ['manager', 'admin'],
    create: ['admin'],
    edit: ['admin'],
    delete: ['admin'],
  },
  reports: {
    view: ['manager', 'admin'],
    create: ['manager', 'admin'],
    export: ['manager', 'admin'],
  },
};

export const useRBAC = () => {
  const { user } = useAuth();

  const checkAccess = (resource: string, action: string): boolean => {
    if (!user) return false;

    const resourceRules = rbacRules[resource];
    if (!resourceRules) return false;

    const allowedRoles = resourceRules[action];
    if (!allowedRoles) return false;

    return allowedRoles.includes(user.role);
  };

  return { checkAccess };
};