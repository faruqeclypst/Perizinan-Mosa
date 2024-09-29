import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebaseConfig';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  User as FirebaseUser,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { User, RoleType } from '../utils/roles';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  reauthenticate: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  login: async () => {},
  reauthenticate: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await fetchUserData(userCredential.user);
  };

  const reauthenticate = async (password: string) => {
    const user = auth.currentUser;
    if (user && user.email) {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
    } else {
      throw new Error('No user is currently signed in.');
    }
  };

  const fetchUserData = async (firebaseUser: FirebaseUser) => {
    console.log("Fetching user data for:", firebaseUser.uid);
    const userRef = ref(db, `users/${firebaseUser.uid}`);
    const snapshot = await get(userRef);
    let userData = snapshot.val();
    
    if (!userData || !userData.role) {
      console.log('User data not found, waiting and retrying...');
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
    }
  };

  useEffect(() => {
    console.log("Setting up auth state listener");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth state changed. User:", firebaseUser?.uid);
      if (firebaseUser) {
        if (!currentUser || currentUser.uid !== firebaseUser.uid) {
          await fetchUserData(firebaseUser);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
  
    return unsubscribe;
  }, [currentUser]);

  useEffect(() => {
    console.log("Current user updated:", currentUser);
  }, [currentUser]);

  const value = {
    currentUser,
    loading,
    login,
    reauthenticate
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// import React, { createContext, useContext, useState, useEffect } from 'react';
// import { auth, db } from '../firebaseConfig';
// import { onAuthStateChanged, signInWithEmailAndPassword, User as FirebaseUser } from 'firebase/auth';
// import { ref, get } from 'firebase/database';
// import { User, RoleType } from '../utils/roles';

// interface AuthContextType {
//   currentUser: User | null;
//   loading: boolean;
//   login: (email: string, password: string) => Promise<void>;
// }

// const AuthContext = createContext<AuthContextType>({
//   currentUser: null,
//   loading: true,
//   login: async () => {},
// });

// export const useAuth = () => useContext(AuthContext);

// export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const [currentUser, setCurrentUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState(true);

//   const login = async (email: string, password: string) => {
//     const userCredential = await signInWithEmailAndPassword(auth, email, password);
//     await fetchUserData(userCredential.user);
//   };

//   const fetchUserData = async (firebaseUser: FirebaseUser) => {
//     console.log("Fetching user data for:", firebaseUser.uid);
//     const userRef = ref(db, `users/${firebaseUser.uid}`);
//     const snapshot = await get(userRef);
//     let userData = snapshot.val();
    
//     if (!userData || !userData.role) {
//       console.log('User data not found, waiting and retrying...');
//       // Wait for 2 seconds and try again
//       await new Promise(resolve => setTimeout(resolve, 2000));
//       const retrySnapshot = await get(userRef);
//       userData = retrySnapshot.val();
//     }
    
//     if (userData && userData.role) {
//       console.log("User data fetched:", userData);
//       setCurrentUser({
//         uid: firebaseUser.uid,
//         email: firebaseUser.email!,
//         role: userData.role as RoleType
//       });
//     } else {
//       console.error('User data or role is missing for uid:', firebaseUser.uid);
//       // Instead of setting currentUser to null, we'll keep the previous state
//     }
//   };

//   useEffect(() => {
//     console.log("Setting up auth state listener");
//     const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
//       console.log("Auth state changed. User:", firebaseUser?.uid);
//       if (firebaseUser) {
//         // Only update the user if it's different from the current user
//         if (!currentUser || currentUser.uid !== firebaseUser.uid) {
//           await fetchUserData(firebaseUser);
//         }
//       } else {
//         setCurrentUser(null);
//       }
//       setLoading(false);
//     });
  
//     return unsubscribe;
//   }, [currentUser]);

//   useEffect(() => {
//     console.log("Current user updated:", currentUser);
//   }, [currentUser]);

//   const value = {
//     currentUser,
//     loading,
//     login
//   };

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// };