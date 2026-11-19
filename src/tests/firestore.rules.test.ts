import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import {
  validateClaimInput,
  validateImageFile,
  validateItemInput,
  validateRegistrationInput,
  VALIDATION_LIMITS,
} from '../utils/validation';

describe('Firestore Security Rules & Schema Synchronization Audit (Dirty Dozen)', () => {
  const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
  const rulesContent = fs.readFileSync(rulesPath, 'utf-8');

  it('Enforces rules_version 2 and default-deny catch-all safety net', () => {
    expect(rulesContent).toContain("rules_version = '2';");
    expect(rulesContent).toContain('match /{document=**}');
    expect(rulesContent).toContain('allow read, write: if false;');
  });

  it('Prevents self-admin privilege escalation and role tampering in users rules', () => {
    expect(rulesContent).toContain("incoming().role in ['student', 'faculty'] || isBootstrapAdmin()");
    expect(rulesContent).toContain('incoming().role == existing().role');
    expect(rulesContent).toContain('incoming().status == existing().status');
  });

  it('Mandates authenticated non-anonymous users, verified bootstrap admin, and strict schema blueprints across collections', () => {
    expect(rulesContent).toContain('isAuthenticatedNonAnon()');
    expect(rulesContent).toContain('request.auth.token.email_verified == true');
    expect(rulesContent).toContain('isValidUser(incoming())');
    expect(rulesContent).toContain('isValidItem(incoming())');
    expect(rulesContent).toContain('isValidClaim(incoming())');
    expect(rulesContent).toContain('isValidNotification(incoming())');
  });

  it('Enforces ID poisoning regex, server timestamps, and terminal state locking', () => {
    expect(rulesContent).toContain("id.matches('^[a-zA-Z0-9_\\\\-]+$')");
    expect(rulesContent).toContain('incoming().createdAt == request.time');
    expect(rulesContent).toContain('incoming().updatedAt == request.time');
    expect(rulesContent).toContain("existing().status != 'Returned'");
  });

  it('Rejects invalid IDs, oversized descriptions, and incomplete claims in synchronized client guards', () => {
    expect(VALIDATION_LIMITS.ID_PATTERN.test('valid_id-123')).toBe(true);
    expect(VALIDATION_LIMITS.ID_PATTERN.test('invalid/id!@#')).toBe(false);

    const badItem = validateItemInput({
      title: 'A',
      type: 'lost',
      category: 'Electronics',
      description: 'short',
      location: '',
      dateReported: '2026/11/19',
      contactSummary: 'ok',
      contactDetails: 'ok',
    });
    expect(badItem.valid).toBe(false);

    const badClaim = validateClaimInput({
      itemId: 'bad id!',
      ownershipProof: 'too short',
      identifyingFeatures: 'no',
    });
    expect(badClaim.valid).toBe(false);

    const badReg = validateRegistrationInput({
      fullName: 'X',
      email: 'not-an-email',
      password: '123',
      confirmPassword: '456',
      role: 'student',
      department: '',
      campusId: '',
    });
    expect(badReg.valid).toBe(false);

    const badImg = validateImageFile({ type: 'image/svg+xml', size: 500 });
    expect(badImg.valid).toBe(false);
  });
});
