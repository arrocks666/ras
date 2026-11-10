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
      email,
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

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}