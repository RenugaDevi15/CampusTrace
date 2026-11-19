import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { BOOTSTRAP_ADMIN_EMAIL, db, handleFirestoreError, OperationType } from '../lib/firebase';
import type { NotificationItem, UserProfile, UserRole, UserStatus } from '../types/campus';
import { normalizeTimestampToMs } from '../utils/matching';
import { sanitizeText, VALIDATION_LIMITS } from '../utils/validation';

export interface ProfileSetupMeta {
  fullName?: string;
  role?: 'student' | 'faculty';
  department?: string;
  campusId?: string;
  phone?: string;
}

const inFlightProfileLoads = new Map<string, Promise<UserProfile>>();

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    return snap.data() as UserProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
  }
}

async function resolveOrCreateUserProfile(firebaseUser: User, meta?: ProfileSetupMeta): Promise<UserProfile> {
  const userRef = doc(db, 'users', firebaseUser.uid);
  const existing = await getDoc(userRef);

  const isBootstrapAdmin =
    Boolean(firebaseUser.email) &&
    firebaseUser.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase() &&
    firebaseUser.emailVerified;

  if (existing.exists()) {
    const profile = existing.data() as UserProfile;
    if (isBootstrapAdmin) {
      const adminMarkerRef = doc(db, 'admins', firebaseUser.uid);
      const adminSnap = await getDoc(adminMarkerRef);
      if (!adminSnap.exists()) {
        await setDoc(adminMarkerRef, {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          grantedBy: 'bootstrap',
          createdAt: serverTimestamp(),
        });
      }
      if (profile.role !== 'admin') {
        await updateDoc(userRef, {
          role: 'admin',
          updatedAt: serverTimestamp(),
        });
        return { ...profile, role: 'admin' };
      }
    }
    return profile;
  }

  const assignedRole: UserRole = isBootstrapAdmin ? 'admin' : meta?.role || 'student';
  const fullName = sanitizeText(
    meta?.fullName || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Campus Member',
    VALIDATION_LIMITS.FULL_NAME_MAX
  );
  const department = sanitizeText(meta?.department || 'General Studies', VALIDATION_LIMITS.DEPARTMENT_MAX);
  const campusId = sanitizeText(
    meta?.campusId || `CT-${firebaseUser.uid.slice(0, 6).toUpperCase()}`,
    VALIDATION_LIMITS.CAMPUS_ID_MAX
  );

  // Never store passwords or sensitive credentials in Firestore
  const payload: Record<string, unknown> = {
    uid: firebaseUser.uid,
    fullName: fullName.length >= 2 ? fullName : 'Campus Member',
    email: sanitizeText(firebaseUser.email || '', VALIDATION_LIMITS.EMAIL_MAX),
    role: assignedRole,
    department: department.length >= 2 ? department : 'General Studies',
    campusId: campusId.length >= 2 ? campusId : 'CT-1001',
    status: 'active' as UserStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (meta?.phone && meta.phone.trim().length > 0) {
    payload.phone = sanitizeText(meta.phone, VALIDATION_LIMITS.PHONE_MAX);
  }

  try {
    const batch = writeBatch(db);
    batch.set(userRef, payload);

    if (isBootstrapAdmin) {
      batch.set(doc(db, 'admins', firebaseUser.uid), {
        uid: firebaseUser.uid,
        email: payload.email,
        grantedBy: 'bootstrap',
        createdAt: serverTimestamp(),
      });
    }

    await batch.commit();
    const createdSnap = await getDoc(userRef);
    return createdSnap.data() as UserProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `users/${firebaseUser.uid}`);
  }
}

export function ensureUserProfile(firebaseUser: User, meta?: ProfileSetupMeta): Promise<UserProfile> {
  const existingPromise = inFlightProfileLoads.get(firebaseUser.uid);
  if (existingPromise) {
    return existingPromise;
  }
  const promise = resolveOrCreateUserProfile(firebaseUser, meta).finally(() => {
    inFlightProfileLoads.delete(firebaseUser.uid);
  });
  inFlightProfileLoads.set(firebaseUser.uid, promise);
  return promise;
}

export async function updateOwnUserProfile(
  uid: string,
  updates: { fullName: string; department: string; campusId: string; phone?: string }
): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const payload: Record<string, unknown> = {
    fullName: sanitizeText(updates.fullName, VALIDATION_LIMITS.FULL_NAME_MAX),
    department: sanitizeText(updates.department, VALIDATION_LIMITS.DEPARTMENT_MAX),
    campusId: sanitizeText(updates.campusId, VALIDATION_LIMITS.CAMPUS_ID_MAX),
    updatedAt: serverTimestamp(),
  };
  if (updates.phone !== undefined) {
    payload.phone = sanitizeText(updates.phone, VALIDATION_LIMITS.PHONE_MAX);
  }
  try {
    await updateDoc(userRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
}

export async function adminUpdateUserRoleAndStatus(
  adminUid: string,
  targetUser: UserProfile,
  role: UserRole,
  status: UserStatus
): Promise<void> {
  const userRef = doc(db, 'users', targetUser.uid);
  const adminMarkerRef = doc(db, 'admins', targetUser.uid);

  try {
    const batch = writeBatch(db);
    batch.update(userRef, {
      role,
      status,
      updatedAt: serverTimestamp(),
    });

    if (role === 'admin') {
      batch.set(adminMarkerRef, {
        uid: targetUser.uid,
        email: targetUser.email,
        grantedBy: adminUid,
        createdAt: serverTimestamp(),
      });
    } else if (targetUser.role === 'admin') {
      batch.delete(adminMarkerRef);
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${targetUser.uid}`);
  }
}

export function subscribeToAllUsers(
  onData: (users: UserProfile[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, 'users'),
    (snapshot) => {
      const list = snapshot.docs.map((d) => d.data() as UserProfile);
      list.sort((a, b) => normalizeTimestampToMs(b.createdAt) - normalizeTimestampToMs(a.createdAt));
      onData(list);
    },
    (error) => {
      if (onError) onError(error);
      else handleFirestoreError(error, OperationType.LIST, 'users');
    }
  );
}

export function subscribeToUserNotifications(
  userId: string,
  onData: (notifications: NotificationItem[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, 'notifications'), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => d.data() as NotificationItem);
      list.sort((a, b) => normalizeTimestampToMs(b.createdAt) - normalizeTimestampToMs(a.createdAt));
      onData(list);
    },
    (error) => {
      if (onError) onError(error);
      else handleFirestoreError(error, OperationType.LIST, 'notifications');
    }
  );
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), { read: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `notifications/${notificationId}`);
  }
}

export async function markAllNotificationsRead(notifications: NotificationItem[]): Promise<void> {
  const unread = notifications.filter((n) => !n.read);
  if (unread.length === 0) return;

  try {
    const batch = writeBatch(db);
    for (const item of unread.slice(0, 50)) {
      batch.update(doc(db, 'notifications', item.id), { read: true });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'notifications');
  }
}
