import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, handleFirestoreError, OperationType, storage } from '../lib/firebase';
import type { ItemContact, ItemReport, ItemStatus, UserProfile } from '../types/campus';
import { sortItemsByNewest } from '../utils/matching';
import {
  compressImageToDataUrl,
  extractKeywords,
  sanitizeText,
  validateImageFile,
  validateItemInput,
  VALIDATION_LIMITS,
  type ItemFormInput,
} from '../utils/validation';

export async function uploadItemImage(file: File, userId: string): Promise<{ url: string; usedFallback: boolean }> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid image file.');
  }

  try {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 64);
    const storageRef = ref(storage, `items/${userId}/${Date.now()}_${safeName}`);
    await uploadBytes(storageRef, file, { contentType: file.type });
    const url = await getDownloadURL(storageRef);
    return { url, usedFallback: false };
  } catch {
    // Graceful fallback to compressed client JPEG data URI if Storage bucket isn't initialized yet
    const compressedUrl = await compressImageToDataUrl(file, 720, 0.7);
    if (compressedUrl.length > VALIDATION_LIMITS.IMAGE_URL_MAX) {
      const smallerUrl = await compressImageToDataUrl(file, 480, 0.55);
      return { url: smallerUrl, usedFallback: true };
    }
    return { url: compressedUrl, usedFallback: true };
  }
}

export async function createItemReport(user: UserProfile, input: ItemFormInput): Promise<string> {
  const validation = validateItemInput(input);
  if (!validation.valid) {
    const firstError = Object.values(validation.errors)[0] || 'Invalid item report details.';
    throw new Error(firstError);
  }

  const itemRef = doc(collection(db, 'items'));
  const itemId = itemRef.id;
  const contactRef = doc(db, 'items', itemId, 'private', 'contact');

  const title = sanitizeText(input.title, VALIDATION_LIMITS.TITLE_MAX);
  const description = sanitizeText(input.description, VALIDATION_LIMITS.DESCRIPTION_MAX);
  const location = sanitizeText(input.location, VALIDATION_LIMITS.LOCATION_MAX);
  const contactSummary = sanitizeText(input.contactSummary, VALIDATION_LIMITS.CONTACT_SUMMARY_MAX);
  const contactDetails = sanitizeText(input.contactDetails, VALIDATION_LIMITS.CONTACT_DETAILS_MAX);
  const pickupLocation = sanitizeText(input.pickupLocation || location, VALIDATION_LIMITS.CONTACT_SUMMARY_MAX);
  const imageUrl = (input.imageUrl || '').slice(0, VALIDATION_LIMITS.IMAGE_URL_MAX);
  const status: ItemStatus = input.type === 'lost' ? 'Lost' : 'Found';
  const keywords = extractKeywords(title, description, input.category, location);

  try {
    const batch = writeBatch(db);
    batch.set(itemRef, {
      id: itemId,
      title,
      type: input.type,
      category: input.category,
      description,
      location,
      dateReported: input.dateReported.trim(),
      status,
      visibility: 'campus',
      imageUrl,
      contactSummary,
      reporterId: user.uid,
      reporterName: sanitizeText(user.fullName, VALIDATION_LIMITS.FULL_NAME_MAX),
      reporterRole: user.role,
      keywords,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    batch.set(contactRef, {
      itemId,
      reporterId: user.uid,
      contactDetails,
      pickupLocation,
      updatedAt: serverTimestamp(),
    });

    await batch.commit();
    return itemId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `items/${itemId}`);
  }
}

export async function updateItemReport(
  itemId: string,
  existing: ItemReport,
  updates: Partial<ItemFormInput> & { status?: ItemStatus }
): Promise<void> {
  const mergedInput: ItemFormInput = {
    title: updates.title ?? existing.title,
    type: existing.type,
    category: updates.category ?? existing.category,
    description: updates.description ?? existing.description,
    location: updates.location ?? existing.location,
    dateReported: updates.dateReported ?? existing.dateReported,
    status: updates.status ?? existing.status,
    contactSummary: updates.contactSummary ?? existing.contactSummary,
    contactDetails: updates.contactDetails ?? existing.contactSummary,
    pickupLocation: updates.pickupLocation ?? existing.location,
    imageUrl: updates.imageUrl ?? existing.imageUrl,
  };

  const validation = validateItemInput(mergedInput);
  if (!validation.valid) {
    const firstError = Object.values(validation.errors)[0] || 'Invalid item update.';
    throw new Error(firstError);
  }

  const itemRef = doc(db, 'items', itemId);
  const contactRef = doc(db, 'items', itemId, 'private', 'contact');
  const title = sanitizeText(mergedInput.title, VALIDATION_LIMITS.TITLE_MAX);
  const description = sanitizeText(mergedInput.description, VALIDATION_LIMITS.DESCRIPTION_MAX);
  const location = sanitizeText(mergedInput.location, VALIDATION_LIMITS.LOCATION_MAX);
  const keywords = extractKeywords(title, description, mergedInput.category, location);

  try {
    const batch = writeBatch(db);
    batch.update(itemRef, {
      title,
      category: mergedInput.category,
      description,
      location,
      dateReported: mergedInput.dateReported.trim(),
      status: mergedInput.status || existing.status,
      imageUrl: (mergedInput.imageUrl || '').slice(0, VALIDATION_LIMITS.IMAGE_URL_MAX),
      contactSummary: sanitizeText(mergedInput.contactSummary, VALIDATION_LIMITS.CONTACT_SUMMARY_MAX),
      keywords,
      updatedAt: serverTimestamp(),
    });

    if (updates.contactDetails !== undefined || updates.pickupLocation !== undefined) {
      batch.update(contactRef, {
        contactDetails: sanitizeText(mergedInput.contactDetails, VALIDATION_LIMITS.CONTACT_DETAILS_MAX),
        pickupLocation: sanitizeText(mergedInput.pickupLocation || location, VALIDATION_LIMITS.CONTACT_SUMMARY_MAX),
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `items/${itemId}`);
  }
}

export async function updateItemStatus(itemId: string, status: ItemStatus): Promise<void> {
  const itemRef = doc(db, 'items', itemId);
  try {
    const batch = writeBatch(db);
    batch.update(itemRef, {
      status,
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `items/${itemId}`);
  }
}

export async function deleteItemReport(itemId: string): Promise<void> {
  const itemRef = doc(db, 'items', itemId);
  const contactRef = doc(db, 'items', itemId, 'private', 'contact');

  try {
    const batch = writeBatch(db);
    batch.delete(contactRef);
    batch.delete(itemRef);
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `items/${itemId}`);
  }
}

export async function getItemById(itemId: string): Promise<ItemReport | null> {
  try {
    const snap = await getDoc(doc(db, 'items', itemId));
    if (!snap.exists()) return null;
    return snap.data() as ItemReport;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `items/${itemId}`);
  }
}

export async function getItemContact(itemId: string): Promise<ItemContact | null> {
  try {
    const snap = await getDoc(doc(db, 'items', itemId, 'private', 'contact'));
    if (!snap.exists()) return null;
    return snap.data() as ItemContact;
  } catch {
    return null;
  }
}

export function subscribeToCampusItems(
  onData: (items: ItemReport[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, 'items'), where('visibility', '==', 'campus'));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => d.data() as ItemReport);
      onData(sortItemsByNewest(list));
    },
    (error) => {
      if (onError) {
        onError(error);
      } else {
        handleFirestoreError(error, OperationType.LIST, 'items');
      }
    }
  );
}

export function subscribeToUserItems(
  userId: string,
  onData: (items: ItemReport[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, 'items'), where('reporterId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => d.data() as ItemReport);
      onData(sortItemsByNewest(list));
    },
    (error) => {
      if (onError) {
        onError(error);
      } else {
        handleFirestoreError(error, OperationType.LIST, 'items');
      }
    }
  );
}
