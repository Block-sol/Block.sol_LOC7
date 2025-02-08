// context/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  collection,
  query,
  orderBy,
  getDocs,
  where, 
  limit
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { AuthContextType, UserData, UserRole } from '@/types/auth';
import { useRouter } from 'next/navigation';

const AuthContext = createContext<AuthContextType | null>(null);

// Helper function to get collection name based on role
const getCollectionName = (role: UserRole): string => {
  switch (role) {
    case 'employee':
      return 'Employee';
    case 'manager':
      return 'Manager';
    case 'admin':
      return 'Admin';
    default:
      return 'Employee';
  }
};

// Helper function to generate next employee ID
const generateNextId = async (role: UserRole): Promise<string> => {
  const prefix = role === 'employee' ? 'emp_' : role === 'manager' ? 'man_' : 'adm_';
  const collectionName = getCollectionName(role);
  
  try {
    // Get all documents in the collection
    const q = query(collection(db, collectionName), orderBy('employeeId', 'desc'), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      // If no documents exist, start with ID 1
      return `${prefix}1`;
    }

    // Get the last document's ID and increment
    const lastDoc = querySnapshot.docs[0];
    const lastId = lastDoc.data().employeeId;
    const lastNumber = parseInt(lastId.split('_')[1]);
    return `${prefix}${lastNumber + 1}`;
  } catch (error) {
    console.error('Error generating next ID:', error);
    throw error;
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();

  // Fetch user data from Firestore
  const fetchUserData = async (firebaseUser: User) => {
    // First, try to find the user in any collection
    for (const role of ['employee', 'manager', 'admin'] as UserRole[]) {
      const collectionName = getCollectionName(role);
      // Query by email instead of uid
      const q = query(collection(db, collectionName), where('email', '==', firebaseUser.email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data() as UserData;
        return {
          ...userData,
          createdAt: userData.createdAt,
          lastLogin: userData.lastLogin,
        };
      }
    }
    return null;
  };

  // Initialize auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userData = await fetchUserData(firebaseUser);
          if (userData) {
            // Update last login using employeeId
            const collectionName = getCollectionName(userData.role);
            if (!userData.employeeId) {
              throw new Error('Employee ID is undefined');
            }
            const userRef = doc(db, collectionName, userData.employeeId);
            await updateDoc(userRef, {
              lastLogin: serverTimestamp()
            });
            setUser(userData);
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Error in auth state change:', err);
        setError(err instanceof Error ? err : new Error('An error occurred'));
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      const userData = await fetchUserData(result.user);
      console.log('User data:', userData);
      if (userData) {
        console.log('in iF');
        setUser(userData);
        console.log('User12344:', user);
        router.push('/employee-claims');
        window.location.href = '/employee-claims';
      }
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err instanceof Error ? err : new Error('Failed to sign in'));
      throw err;
    }
  };

  const signUp = async (email: string, password: string, userData: Partial<UserData>) => {
    try {
      setError(null);
      if (!userData.role) {
        throw new Error('Role is required');
      }

      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Generate employeeId based on role
      const employeeId = await generateNextId(userData.role);
      
      // Create user document in appropriate collection
      const newUser: UserData = {
        email: result.user.email!,
        role: userData.role,
        employeeId: employeeId,
        displayName: userData.displayName,
        department: userData.department,
        createdAt: new Date(),
        lastLogin: new Date(),
      };

      const collectionName = getCollectionName(userData.role);
      await setDoc(doc(db, collectionName, employeeId), newUser);
      
      setUser(newUser);
      router.push('/employee-claims');
    } catch (err) {
      console.error('Sign up error:', err);
      setError(err instanceof Error ? err : new Error('Failed to sign up'));
      throw err;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      router.push('/login');
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to sign out'));
      throw err;
    }
  };

  const updateUserData = async (data: Partial<UserData>) => {
    if (!user?.employeeId) return;

    try {
      const collectionName = getCollectionName(user.role);
      const userRef = doc(db, collectionName, user.employeeId);
      await updateDoc(userRef, { ...data });
      setUser(prev => prev ? { ...prev, ...data } : null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update user data'));
      throw err;
    }
  };

  const checkPermission = (requiredRole: UserRole): boolean => {
    if (!user) return false;
    
    const roleHierarchy: Record<UserRole, number> = {
      'employee': 1,
      'manager': 2,
      'admin': 3
    };

    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  };

  const value = {
    user,
    loading,
    error,
    signIn,
    signOut,
    signUp,
    updateUserData,
    checkPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};