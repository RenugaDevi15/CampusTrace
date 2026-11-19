import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  getRedirectResult,
  onAuthStateChanged,
  onIdTokenChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth, googleProvider, mapAuthError } from '../lib/firebase';
import { ensureUserProfile, type ProfileSetupMeta } from '../services/usersService';
import type { UserProfile } from '../types/campus';

const PENDING_GOOGLE_META_KEY = 'ct_google_pending_meta';

interface AuthContextValue {
  firebaseUser: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isVerified: boolean;
  isAdmin: boolean;
  isFaculty: boolean;
  isStudent: boolean;
  loginWithGoogle: (meta?: ProfileSetupMeta) => Promise<UserProfile | null>;
  loginWithEmail: (email: string, password: string) => Promise<UserProfile>;
  registerWithEmail: (
    email: string,
    password: string,
    meta: Required<Pick<ProfileSetupMeta, 'fullName' | 'role' | 'department' | 'campusId'>> & { phone?: string }
  ) => Promise<UserProfile>;
  resendVerification: () => Promise<void>;
  refreshVerificationState: () => Promise<boolean>;
  sendResetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserProfile = useCallback(async (user: User, meta?: ProfileSetupMeta): Promise<UserProfile | null> => {
    try {
      const loaded = await ensureUserProfile(user, meta);
      setProfile(loaded);
      return loaded;
    } catch (error) {
      console.error('Failed to load user profile:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    let active = true;

    // Complete Google OAuth redirect flow if returning from signInWithRedirect
    getRedirectResult(auth)
      .then(async (redirectResult) => {
        if (!active || !redirectResult?.user) return;
        let pendingMeta: ProfileSetupMeta | undefined;
        try {
          const raw = sessionStorage.getItem(PENDING_GOOGLE_META_KEY);
          if (raw) {
            pendingMeta = JSON.parse(raw) as ProfileSetupMeta;
            sessionStorage.removeItem(PENDING_GOOGLE_META_KEY);
          }
        } catch {
          // Ignore storage read failure
        }
        await loadUserProfile(redirectResult.user, pendingMeta);
      })
      .catch((err) => {
        console.warn('Google redirect result check:', mapAuthError(err));
      });

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      setFirebaseUser(user);
      if (user) {
        await loadUserProfile(user);
      } else {
        setProfile(null);
      }
      if (active) setLoading(false);
    });

    // Monitor token refresh / expiration cleanly
    const unsubToken = onIdTokenChanged(auth, async (user) => {
      if (!active) return;
      if (!user) {
        setFirebaseUser(null);
        setProfile(null);
        return;
      }
      try {
        await user.getIdTokenResult();
      } catch {
        // Expired or revoked session
        await signOut(auth);
        setFirebaseUser(null);
        setProfile(null);
      }
    });

    return () => {
      active = false;
      unsubAuth();
      unsubToken();
    };
  }, [loadUserProfile]);

  const loginWithGoogle = useCallback(async (meta?: ProfileSetupMeta): Promise<UserProfile | null> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const loaded = await ensureUserProfile(result.user, meta);
      setFirebaseUser(result.user);
      setProfile(loaded);
      return loaded;
    } catch (err) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
        try {
          if (meta) {
            sessionStorage.setItem(PENDING_GOOGLE_META_KEY, JSON.stringify(meta));
          }
        } catch {
          // Ignore storage error
        }
        await signInWithRedirect(auth, googleProvider);
        return null;
      }
      throw new Error(mapAuthError(err));
    }
  }, []);

  const loginWithEmail = useCallback(async (email: string, password: string): Promise<UserProfile> => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const loaded = await ensureUserProfile(cred.user);
      setFirebaseUser(cred.user);
      setProfile(loaded);
      return loaded;
    } catch (err) {
      throw new Error(mapAuthError(err));
    }
  }, []);

  const registerWithEmail = useCallback(
    async (
      email: string,
      password: string,
      meta: Required<Pick<ProfileSetupMeta, 'fullName' | 'role' | 'department' | 'campusId'>> & { phone?: string }
    ): Promise<UserProfile> => {
      const normalizedEmail = email.trim();
      try {
        try {
          const methods = await fetchSignInMethodsForEmail(auth, normalizedEmail);
          if (methods && methods.length > 0) {
            throw new Error('This email address is already registered. Please sign in or use a different email.');
          }
        } catch (checkErr) {
          if (checkErr instanceof Error && checkErr.message.includes('already registered')) {
            throw checkErr;
          }
          // Continue to createUserWithEmailAndPassword if enumeration protection is active
        }

        const cred = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
        await updateProfile(cred.user, { displayName: meta.fullName.trim() });

        // Persist user profile & role directly to Firestore
        const loaded = await ensureUserProfile(cred.user, meta);
        setFirebaseUser(cred.user);
        setProfile(loaded);

        // Non-blocking courtesy verification email
        sendEmailVerification(cred.user).catch(() => undefined);

        return loaded;
      } catch (err) {
        if (err instanceof Error && err.message.includes('already registered')) {
          throw err;
        }
        throw new Error(mapAuthError(err));
      }
    },
    []
  );

  const resendVerification = useCallback(async () => {
    if (!auth.currentUser) throw new Error('No signed-in user.');
    await sendEmailVerification(auth.currentUser);
  }, []);

  const refreshVerificationState = useCallback(async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    await auth.currentUser.reload();
    const updatedUser = auth.currentUser;
    setFirebaseUser(updatedUser);
    const loaded = await ensureUserProfile(updatedUser);
    setProfile(loaded);
    return Boolean(updatedUser.emailVerified);
  }, []);

  const sendResetPassword = useCallback(async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err) {
      throw new Error(mapAuthError(err));
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setFirebaseUser(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (auth.currentUser) {
      await loadUserProfile(auth.currentUser);
    }
  }, [loadUserProfile]);

  const isVerified = Boolean(firebaseUser);
  const isAdmin = profile?.role === 'admin';
  const isFaculty = profile?.role === 'faculty';
  const isStudent = profile?.role === 'student';

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        profile,
        loading,
        isVerified,
        isAdmin,
        isFaculty,
        isStudent,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        resendVerification,
        refreshVerificationState,
        sendResetPassword,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an AuthProvider.');
  }
  return ctx;
}
