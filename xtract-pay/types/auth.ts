// types/auth.ts
export type UserRole = 'employee' | 'manager' | 'admin';

export interface UserData {
  email: string;
  displayName?: string;
  role: UserRole;
  department?: string;
  employeeId?: string;
  createdAt: Date;
  lastLogin: Date;
}

export interface AuthContextType {
  user: UserData | null;
  loading: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, userData: Partial<UserData>) => Promise<void>;
  updateUserData: (data: Partial<UserData>) => Promise<void>;
  checkPermission: (requiredRole: UserRole) => boolean;
}