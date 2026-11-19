import { initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  getAuth,
  GoogleAuthProvider,
  setPersistence,
} from 'firebase/auth';
import { doc, getDocFromServer, getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// CRITICAL: Pass firestoreDatabaseId explicitly for named Enterprise Firestore databases
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Ensure authenticated sessions persist across page refreshes
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Could not configure browserLocalPersistence:', err);
});

export const BOOTSTRAP_ADMIN_EMAIL = 'renugadevib15@gmail.com';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function mapAuthError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  const code = (error as { code?: string })?.code || '';
  const combined = `${code} ${raw}`;

  if (combined.includes('auth/email-already-in-use')) {
    return 'This email address is already registered. Please sign in or use a different email.';
  }
  if (combined.includes('auth/invalid-credential') || combined.includes('auth/wrong-password') || combined.includes('auth/user-not-found')) {
    return 'Invalid email or password. Please verify your credentials and try again.';
  }
  if (combined.includes('auth/invalid-email')) {
    return 'Please enter a valid email address.';
  }
  if (combined.includes('auth/weak-password')) {
    return 'Password is too weak. Use at least 6 characters with letters and numbers.';
  }
  if (combined.includes('auth/too-many-requests')) {
    return 'Too many failed attempts. Please wait a moment before trying again.';
  }
  if (combined.includes('auth/user-disabled')) {
    return 'This account has been disabled. Contact a campus administrator.';
  }
  if (combined.includes('auth/user-token-expired') || combined.includes('auth/requires-recent-login')) {
    return 'Your authentication session has expired. Please sign in again.';
  }
  if (combined.includes('auth/popup-closed-by-user')) {
    return 'Google sign-in popup was closed before completion. Please try again.';
  }
  if (combined.includes('auth/cancelled-popup-request')) {
    return 'Another sign-in popup is already open. Please finish or close it first.';
  }
  if (combined.includes('auth/popup-blocked')) {
    return 'Sign-in popup was blocked by your browser. Redirecting to Google Sign-In...';
  }
  if (combined.includes('auth/unauthorized-domain')) {
    const host = typeof window !== 'undefined' ? window.location.hostname : 'this domain';
    return `Domain "${host}" is not authorized in Firebase Authentication. Add "${host}" under Firebase Console → Authentication → Settings → Authorized domains.`;
  }
  if (combined.includes('auth/operation-not-allowed')) {
    return 'Email/Password sign-in is not yet enabled in Firebase Console (Authentication → Sign-in method → Email/Password). Enable it in the Firebase Console or use Continue with Google.';
  }
  if (combined.includes('auth/account-exists-with-different-credential')) {
    return 'An account already exists with this email using a different sign-in method. Sign in with your original method.';
  }
  if (combined.includes('auth/network-request-failed')) {
    return 'Network error while contacting Firebase Authentication. Check your internet connection and retry.';
  }
  return raw || 'Authentication failed. Please try again.';
}

export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration: client is offline.');
      return false;
    }
    // Permission error on test/connection confirms Firestore server is reachable
    return true;
  }
}

testConnection();
