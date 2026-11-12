"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export type UserProfile = {
  phone?: string;
  email?: string;
  name?: string;
  savedAddress?: {
    name?: string;
    phone?: string;
    address?: string;
    district?: string;
    email?: string;
  };
};

type AuthContextType = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  signup: (phone: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>; // ✅ NEW
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const snap = await getDoc(doc(db, "users", u.uid));
          if (snap.exists()) setProfile(snap.data() as UserProfile);
          else setProfile(null);
        } catch (err) {
          console.error("Error fetching user profile:", err);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const login = async (phone: string, password: string) => {
    const normalized = phone.replace(/\D/g, "");
    const email = `${normalized}@ratrysartistry.app`;
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (phone: string, password: string, name?: string) => {
    const normalized = phone.replace(/\D/g, "");
    const email = `${normalized}@ratrysartistry.app`;
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    // Save user document
    await setDoc(doc(db, "users", cred.user.uid), {
      phone: normalized,
      email, // Store the fake email as default
      name: name || "",
      savedAddress: {},
    });

    // Update profile state
    setProfile({
      phone: normalized,
      email,
      name: name || "",
      savedAddress: {},
    });
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  // ✅ NEW: Update Profile Function
  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) throw new Error("Not logged in");
    
    // Save to Firestore with merge: true so we don't overwrite the whole doc
    await setDoc(doc(db, "users", user.uid), data, { merge: true });
    
    // Instantly update the local state so the UI reflects the changes
    setProfile((prev) => prev ? { ...prev, ...data } : null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}