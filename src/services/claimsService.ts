import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import type { ClaimRequest, ClaimStatus, ItemReport, UserProfile } from '../types/campus';
import { normalizeTimestampToMs } from '../utils/matching';
import { sanitizeText, validateClaimInput, VALIDATION_LIMITS, type ClaimFormInput } from '../utils/validation';

function sortClaimsByNewest(claims: ClaimRequest[]): ClaimRequest[] {
  return [...claims].sort((a, b) => normalizeTimestampToMs(b.createdAt) - normalizeTimestampToMs(a.createdAt));
}

export async function submitOwnershipClaim(
  claimant: UserProfile,
  targetItem: ItemReport,
  input: ClaimFormInput
): Promise<string> {
  if (targetItem.type !== 'found' || targetItem.status !== 'Found') {
    throw new Error('Claims can only be submitted for available Found items.');
  }

  if (targetItem.reporterId === claimant.uid) {
    throw new Error('You cannot submit an ownership claim on an item you reported yourself.');
  }

  const validation = validateClaimInput(input);
  if (!validation.valid) {
    const firstError = Object.values(validation.errors)[0] || 'Please complete all required ownership details.';
    throw new Error(firstError);
  }

  const claimRef = doc(collection(db, 'claims'));
  const claimId = claimRef.id;
  const notifRef = doc(collection(db, 'notifications'));
  const nowLabel = new Date().toISOString().slice(0, 10);

  try {
    const batch = writeBatch(db);
    batch.set(claimRef, {
      id: claimId,
      itemId: targetItem.id,
      itemTitle: sanitizeText(targetItem.title, VALIDATION_LIMITS.TITLE_MAX),
      itemCategory: sanitizeText(targetItem.category, 60),
      itemReporterId: targetItem.reporterId,
      claimantId: claimant.uid,
      claimantName: sanitizeText(claimant.fullName, VALIDATION_LIMITS.FULL_NAME_MAX),
      claimantEmail: sanitizeText(claimant.email, VALIDATION_LIMITS.EMAIL_MAX),
      claimantRole: claimant.role,
      ownershipProof: sanitizeText(input.ownershipProof, VALIDATION_LIMITS.OWNERSHIP_PROOF_MAX),
      identifyingFeatures: sanitizeText(input.identifyingFeatures, VALIDATION_LIMITS.IDENTIFYING_FEATURES_MAX),
      supportingImageUrl: (input.supportingImageUrl || '').slice(0, VALIDATION_LIMITS.IMAGE_URL_MAX),
      status: 'Pending' as ClaimStatus,
      reviewerId: '',
      reviewerName: '',
      reviewNotes: '',
      history: [`${nowLabel} · Claim submitted by ${claimant.fullName}`],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    batch.set(notifRef, {
      id: notifRef.id,
      userId: targetItem.reporterId,
      title: 'New Ownership Claim Submitted',
      message: `${claimant.fullName} submitted an ownership claim for "${targetItem.title}".`,
      type: 'claim_submitted',
      relatedItemId: targetItem.id,
      relatedClaimId: claimId,
      read: false,
      createdAt: serverTimestamp(),
    });

    await batch.commit();
    return claimId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `claims/${claimId}`);
  }
}

export async function facultyVerifyClaim(
  faculty: UserProfile,
  claim: ClaimRequest,
  notes: string
): Promise<void> {
  if (claim.status !== 'Pending') {
    throw new Error('Only pending claims can be faculty verified.');
  }

  const cleanNotes = sanitizeText(notes || 'Verified against campus student/staff records.', VALIDATION_LIMITS.REVIEW_NOTES_MAX);
  const nowLabel = new Date().toISOString().slice(0, 10);
  const nextHistory = [
    ...claim.history.slice(-18),
    `${nowLabel} · Faculty verified by ${faculty.fullName}: ${cleanNotes}`.slice(0, 248),
  ];

  const claimRef = doc(db, 'claims', claim.id);
  const itemRef = doc(db, 'items', claim.itemId);
  const notifRef = doc(collection(db, 'notifications'));

  try {
    const batch = writeBatch(db);
    batch.update(claimRef, {
      status: 'Faculty Verified',
      reviewerId: faculty.uid,
      reviewerName: sanitizeText(faculty.fullName, VALIDATION_LIMITS.FULL_NAME_MAX),
      reviewNotes: cleanNotes,
      history: nextHistory,
      updatedAt: serverTimestamp(),
    });

    batch.update(itemRef, {
      status: 'Claimed',
      updatedAt: serverTimestamp(),
    });

    batch.set(notifRef, {
      id: notifRef.id,
      userId: claim.claimantId,
      title: 'Claim Verified by Faculty',
      message: `Your claim for "${claim.itemTitle}" has been verified by ${faculty.fullName} and forwarded for final approval.`,
      type: 'claim_verified',
      relatedItemId: claim.itemId,
      relatedClaimId: claim.id,
      read: false,
      createdAt: serverTimestamp(),
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `claims/${claim.id}`);
  }
}

export async function adminResolveClaim(
  admin: UserProfile,
  claim: ClaimRequest,
  decision: 'Approved' | 'Rejected',
  reviewNotes: string,
  markItemReturned = false
): Promise<void> {
  const cleanNotes = sanitizeText(
    reviewNotes || (decision === 'Approved' ? 'Ownership verified and approved.' : 'Insufficient ownership verification details.'),
    VALIDATION_LIMITS.REVIEW_NOTES_MAX
  );

  const nowLabel = new Date().toISOString().slice(0, 10);
  const nextHistory = [
    ...claim.history.slice(-18),
    `${nowLabel} · ${decision} by Admin (${admin.fullName}): ${cleanNotes}`.slice(0, 248),
  ];

  const claimRef = doc(db, 'claims', claim.id);
  const itemRef = doc(db, 'items', claim.itemId);
  const notifRef = doc(collection(db, 'notifications'));

  const nextItemStatus =
    decision === 'Approved' ? (markItemReturned ? 'Returned' : 'Claimed') : 'Found';

  try {
    const batch = writeBatch(db);
    batch.update(claimRef, {
      status: decision,
      reviewerId: admin.uid,
      reviewerName: sanitizeText(admin.fullName, VALIDATION_LIMITS.FULL_NAME_MAX),
      reviewNotes: cleanNotes,
      history: nextHistory,
      updatedAt: serverTimestamp(),
    });

    batch.update(itemRef, {
      status: nextItemStatus,
      updatedAt: serverTimestamp(),
    });

    batch.set(notifRef, {
      id: notifRef.id,
      userId: claim.claimantId,
      title: decision === 'Approved' ? 'Ownership Claim Approved' : 'Ownership Claim Declined',
      message:
        decision === 'Approved'
          ? `Your claim for "${claim.itemTitle}" was approved. Note: ${cleanNotes}`
          : `Your claim for "${claim.itemTitle}" was declined. Reason: ${cleanNotes}`,
      type: decision === 'Approved' ? 'claim_approved' : 'claim_rejected',
      relatedItemId: claim.itemId,
      relatedClaimId: claim.id,
      read: false,
      createdAt: serverTimestamp(),
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `claims/${claim.id}`);
  }
}

export function subscribeToUserClaims(
  userId: string,
  onData: (claims: ClaimRequest[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, 'claims'), where('claimantId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      onData(sortClaimsByNewest(snapshot.docs.map((d) => d.data() as ClaimRequest)));
    },
    (error) => {
      if (onError) onError(error);
      else handleFirestoreError(error, OperationType.LIST, 'claims');
    }
  );
}

export function subscribeToAllClaims(
  onData: (claims: ClaimRequest[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, 'claims'),
    (snapshot) => {
      onData(sortClaimsByNewest(snapshot.docs.map((d) => d.data() as ClaimRequest)));
    },
    (error) => {
      if (onError) onError(error);
      else handleFirestoreError(error, OperationType.LIST, 'claims');
    }
  );
}
