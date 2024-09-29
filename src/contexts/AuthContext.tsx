import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebaseConfig';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  User as FirebaseUser,
  signOut
} from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { User, RoleType } from '../utils/roles';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Check if user exists in the database
    const userRef = ref(db, `users/${user.uid}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      // User doesn't exist in the database
      await signOut(auth); // Sign out the user
      throw new Error('ACCOUNT_DELETED');
    }

    // If user exists, proceed with fetching user data
    await fetchUserData(user);
  };

  const logout = () => signOut(auth);

  const fetchUserData = async (firebaseUser: FirebaseUser) => {
    console.log("Fetching user data for:", firebaseUser.uid);
    const userRef = ref(db, `users/${firebaseUser.uid}`);
    const snapshot = await get(userRef);
    let userData = snapshot.val();
    
    if (!userData || !userData.role) {
      console.log('User data not found, waiting and retrying...');
      // Wait for 2 seconds and try again
      await new Promise(resolve => setTimeout(resolve, 2000));
      const retrySnapshot = await get(userRef);
      userData = retrySnapshot.val();
    }
    
    if (userData && userData.role) {
      console.log("User data fetched:", userData);
      setCurrentUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        role: userData.role as RoleType
      });
    } else {
      console.error('User data or role is missing for uid:', firebaseUser.uid);
      // Instead of setting currentUser to null, we'll keep the previous state
    }
  };

  useEffect(() => {
    console.log("Setting up auth state listener");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth state changed. User:", firebaseUser?.uid);
      if (firebaseUser) {
        await fetchUserData(firebaseUser);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
  
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};