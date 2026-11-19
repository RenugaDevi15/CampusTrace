import {
  ITEM_CATEGORIES,
  ITEM_STATUSES,
  type ItemCategory,
  type ItemStatus,
  type ItemType,
  type ValidationResult,
} from '../types/campus';

/**
 * Synchronized validation constants matching firebase-blueprint.json & firestore.rules.
 */
export const VALIDATION_LIMITS = {
  ID_MAX: 128,
  ID_PATTERN: /^[a-zA-Z0-9_-]+$/,
  EMAIL_MAX: 150,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  DATE_PATTERN: /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/,
  FULL_NAME_MIN: 2,
  FULL_NAME_MAX: 100,
  DEPARTMENT_MIN: 2,
  DEPARTMENT_MAX: 100,
  CAMPUS_ID_MIN: 2,
  CAMPUS_ID_MAX: 40,
  PHONE_MAX: 30,
  TITLE_MIN: 2,
  TITLE_MAX: 120,
  DESCRIPTION_MIN: 10,
  DESCRIPTION_MAX: 2000,
  LOCATION_MIN: 2,
  LOCATION_MAX: 150,
  CONTACT_SUMMARY_MIN: 3,
  CONTACT_SUMMARY_MAX: 160,
  CONTACT_DETAILS_MIN: 3,
  CONTACT_DETAILS_MAX: 200,
  IMAGE_URL_MAX: 300000,
  IMAGE_FILE_MAX_BYTES: 5 * 1024 * 1024, // 5 MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  KEYWORDS_MAX: 15,
  OWNERSHIP_PROOF_MIN: 15,
  OWNERSHIP_PROOF_MAX: 1500,
  IDENTIFYING_FEATURES_MIN: 5,
  IDENTIFYING_FEATURES_MAX: 1000,
  REVIEW_NOTES_MAX: 1000,
  SEARCH_QUERY_MAX: 120,
} as const;

export interface ItemFormInput {
  title: string;
  type: ItemType;
  category: ItemCategory | string;
  description: string;
  location: string;
  dateReported: string;
  status?: ItemStatus;
  contactSummary: string;
  contactDetails: string;
  pickupLocation?: string;
  imageUrl?: string;
}

export interface ClaimFormInput {
  itemId: string;
  ownershipProof: string;
  identifyingFeatures: string;
  supportingImageUrl?: string;
}

export interface RegistrationFormInput {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'student' | 'faculty';
  department: string;
  campusId: string;
  phone?: string;
}

export interface LoginFormInput {
  email: string;
  password: string;
}

export function sanitizeText(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength);
}

export function extractKeywords(title: string, description: string, category: string, location: string): string[] {
  const raw = `${title} ${description} ${category} ${location}`
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length >= 3 && word.length <= 50);

  const stopWords = new Set(['the', 'and', 'for', 'with', 'near', 'from', 'that', 'this', 'was', 'are', 'have']);
  const unique: string[] = [];
  for (const word of raw) {
    if (!stopWords.has(word) && !unique.includes(word)) {
      unique.push(word);
      if (unique.length >= VALIDATION_LIMITS.KEYWORDS_MAX) break;
    }
  }
  return unique;
}

export function validateItemInput(input: ItemFormInput): ValidationResult {
  const errors: Record<string, string> = {};
  const title = (input.title || '').trim();
  const description = (input.description || '').trim();
  const location = (input.location || '').trim();
  const dateReported = (input.dateReported || '').trim();
  const contactSummary = (input.contactSummary || '').trim();
  const contactDetails = (input.contactDetails || '').trim();

  if (title.length < VALIDATION_LIMITS.TITLE_MIN || title.length > VALIDATION_LIMITS.TITLE_MAX) {
    errors.title = `Item name must be between ${VALIDATION_LIMITS.TITLE_MIN} and ${VALIDATION_LIMITS.TITLE_MAX} characters.`;
  }

  if (input.type !== 'lost' && input.type !== 'found') {
    errors.type = 'Report type must be Lost or Found.';
  }

  if (!ITEM_CATEGORIES.includes(input.category as ItemCategory)) {
    errors.category = 'Please select a valid item category.';
  }

  if (description.length < VALIDATION_LIMITS.DESCRIPTION_MIN || description.length > VALIDATION_LIMITS.DESCRIPTION_MAX) {
    errors.description = `Description must be between ${VALIDATION_LIMITS.DESCRIPTION_MIN} and ${VALIDATION_LIMITS.DESCRIPTION_MAX} characters.`;
  }

  if (location.length < VALIDATION_LIMITS.LOCATION_MIN || location.length > VALIDATION_LIMITS.LOCATION_MAX) {
    errors.location = `Location must be between ${VALIDATION_LIMITS.LOCATION_MIN} and ${VALIDATION_LIMITS.LOCATION_MAX} characters.`;
  }

  if (!VALIDATION_LIMITS.DATE_PATTERN.test(dateReported)) {
    errors.dateReported = 'Please enter a valid date in YYYY-MM-DD format.';
  } else {
    const parsed = new Date(`${dateReported}T00:00:00Z`);
    const [yr, mo, dy] = dateReported.split('-').map(Number);
    if (
      Number.isNaN(parsed.getTime()) ||
      parsed.getUTCFullYear() !== yr ||
      parsed.getUTCMonth() + 1 !== mo ||
      parsed.getUTCDate() !== dy
    ) {
      errors.dateReported = 'Please enter a valid calendar date.';
    }
  }

  if (input.status && !ITEM_STATUSES.includes(input.status)) {
    errors.status = 'Invalid item status.';
  }

  if (contactSummary.length < VALIDATION_LIMITS.CONTACT_SUMMARY_MIN || contactSummary.length > VALIDATION_LIMITS.CONTACT_SUMMARY_MAX) {
    errors.contactSummary = 'Drop-off desk or campus contact summary is required (3–160 characters).';
  }

  if (contactDetails.length < VALIDATION_LIMITS.CONTACT_DETAILS_MIN || contactDetails.length > VALIDATION_LIMITS.CONTACT_DETAILS_MAX) {
    errors.contactDetails = 'Direct contact details are required (3–200 characters).';
  }

  if (input.imageUrl && input.imageUrl.length > VALIDATION_LIMITS.IMAGE_URL_MAX) {
    errors.imageUrl = 'Image payload exceeds maximum storage limit.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateImageFile(file: { type: string; size: number; name?: string } | null | undefined): {
  valid: boolean;
  error?: string;
} {
  if (!file) {
    return { valid: false, error: 'No image file provided.' };
  }

  if (!VALIDATION_LIMITS.ALLOWED_IMAGE_TYPES.includes(file.type as (typeof VALIDATION_LIMITS.ALLOWED_IMAGE_TYPES)[number])) {
    return { valid: false, error: 'Only JPEG, PNG, and WebP image files are supported.' };
  }

  if (file.size <= 0) {
    return { valid: false, error: 'Selected image file is empty.' };
  }

  if (file.size > VALIDATION_LIMITS.IMAGE_FILE_MAX_BYTES) {
    return { valid: false, error: 'Image file size must not exceed 5 MB.' };
  }

  return { valid: true };
}

export function validateClaimInput(input: ClaimFormInput): ValidationResult {
  const errors: Record<string, string> = {};
  const itemId = (input.itemId || '').trim();
  const ownershipProof = (input.ownershipProof || '').trim();
  const identifyingFeatures = (input.identifyingFeatures || '').trim();

  if (!itemId || !VALIDATION_LIMITS.ID_PATTERN.test(itemId)) {
    errors.itemId = 'Invalid item identifier.';
  }

  if (
    ownershipProof.length < VALIDATION_LIMITS.OWNERSHIP_PROOF_MIN ||
    ownershipProof.length > VALIDATION_LIMITS.OWNERSHIP_PROOF_MAX
  ) {
    errors.ownershipProof = `Ownership proof must be at least ${VALIDATION_LIMITS.OWNERSHIP_PROOF_MIN} characters.`;
  }

  if (
    identifyingFeatures.length < VALIDATION_LIMITS.IDENTIFYING_FEATURES_MIN ||
    identifyingFeatures.length > VALIDATION_LIMITS.IDENTIFYING_FEATURES_MAX
  ) {
    errors.identifyingFeatures = `Identifying features must be at least ${VALIDATION_LIMITS.IDENTIFYING_FEATURES_MIN} characters.`;
  }

  if (input.supportingImageUrl && input.supportingImageUrl.length > VALIDATION_LIMITS.IMAGE_URL_MAX) {
    errors.supportingImageUrl = 'Supporting image exceeds maximum size.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateLoginInput(input: LoginFormInput): ValidationResult {
  const errors: Record<string, string> = {};
  const email = (input.email || '').trim();
  const password = input.password || '';

  if (!email) {
    errors.email = 'Email address is required.';
  } else if (!VALIDATION_LIMITS.EMAIL_PATTERN.test(email) || email.length > VALIDATION_LIMITS.EMAIL_MAX) {
    errors.email = 'Please enter a valid university email address.';
  }

  if (!password) {
    errors.password = 'Password is required.';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters long.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateRegistrationInput(input: RegistrationFormInput): ValidationResult {
  const errors: Record<string, string> = {};
  const fullName = (input.fullName || '').trim();
  const email = (input.email || '').trim();
  const department = (input.department || '').trim();
  const campusId = (input.campusId || '').trim();
  const password = input.password || '';
  const confirmPassword = input.confirmPassword ?? '';

  if (fullName.length < VALIDATION_LIMITS.FULL_NAME_MIN || fullName.length > VALIDATION_LIMITS.FULL_NAME_MAX) {
    errors.fullName = 'Full name must be between 2 and 100 characters.';
  }

  if (!VALIDATION_LIMITS.EMAIL_PATTERN.test(email) || email.length > VALIDATION_LIMITS.EMAIL_MAX) {
    errors.email = 'Please provide a valid university email address.';
  }

  if (!password || password.length < 6) {
    errors.password = 'Password must be at least 6 characters long.';
  } else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    errors.password = 'Password must include both letters and at least one number.';
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Please confirm your password.';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  if (input.role !== 'student' && input.role !== 'faculty') {
    errors.role = 'Role must be Student or Faculty.';
  }

  if (department.length < VALIDATION_LIMITS.DEPARTMENT_MIN || department.length > VALIDATION_LIMITS.DEPARTMENT_MAX) {
    errors.department = 'Department or office name is required.';
  }

  if (campusId.length < VALIDATION_LIMITS.CAMPUS_ID_MIN || campusId.length > VALIDATION_LIMITS.CAMPUS_ID_MAX) {
    errors.campusId = 'Valid student or faculty ID is required.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateSearchQuery(query: string): { valid: boolean; sanitized: string; error?: string } {
  const trimmed = (query || '').trim();
  if (trimmed.length > VALIDATION_LIMITS.SEARCH_QUERY_MAX) {
    return {
      valid: false,
      sanitized: trimmed.slice(0, VALIDATION_LIMITS.SEARCH_QUERY_MAX),
      error: `Search query must not exceed ${VALIDATION_LIMITS.SEARCH_QUERY_MAX} characters.`,
    };
  }
  if (/[<>]/.test(trimmed)) {
    return {
      valid: false,
      sanitized: trimmed.replace(/[<>]/g, ''),
      error: 'Search query contains unsupported characters (< or >).',
    };
  }
  return { valid: true, sanitized: trimmed };
}

export async function compressImageToDataUrl(file: File, maxDimension = 720, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image content.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
