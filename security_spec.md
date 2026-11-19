# CampusTrace Security Specification (Phase 0)

## 1. Data Invariants
1. **Identity Integrity**: A user document `/users/{userId}` can only be created by the verified owner matching `request.auth.uid`, and cannot self-assign `role: "admin"` unless their verified email is the bootstrapped admin email.
2. **Item Ownership & Referential Integrity**: Every `/items/{itemId}` report must bind `reporterId == request.auth.uid`, enforce `createdAt == request.time`, and restrict edits/deletes to the original reporter (while not returned) or an administrator.
3. **PII Isolation**: Direct contact details (`email`, `phone`, `contactDetails`) are isolated in `/users/{userId}` (readable only by owner or admin) and `/items/{itemId}/private/contact` (readable only by verified signed-in campus users, reporter, or admin).
4. **Claim Referential & State Integrity**: A claim `/claims/{claimId}` cannot exist without an existing parent `/items/{itemId}` whose `type == 'found'` and `status == 'Found'`. Claimants cannot approve or reject their own claims.
5. **Terminal State Locking**: Once a claim reaches `Approved` or `Rejected`, non-admin users cannot mutate it. Once an item reaches `Returned`, non-admin users cannot mutate or delete it.
6. **Notification Scoping**: Notifications `/notifications/{notificationId}` can only be read, marked read, or deleted by the recipient `userId` or an administrator.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Self-Admin Privilege Escalation**: Student registers `/users/u1` with `{ role: "admin" }`. Expected: `PERMISSION_DENIED`.
2. **Role Tampering on Profile Update**: Student updates `/users/u1` changing `role` from `"student"` to `"admin"`. Expected: `PERMISSION_DENIED`.
3. **Unverified Email Spoofing**: Unverified token (`email_verified: false`) tries to create `/items/item1`. Expected: `PERMISSION_DENIED`.
4. **Shadow Field Injection on Item**: Verified user creates `/items/item1` with extra ghost field `isOfficialVerified: true`. Expected: `PERMISSION_DENIED`.
5. **Identity Spoofing on Item Creation**: User `u1` creates `/items/item1` with `reporterId: "u2"`. Expected: `PERMISSION_DENIED`.
6. **Client Timestamp Forgery**: User creates `/items/item1` with `createdAt: "2020-01-01T00:00:00Z"` instead of `request.time`. Expected: `PERMISSION_DENIED`.
7. **ID Poisoning Attack**: User attempts write to `/items/!@#$%invalid_id` or 200-char ID. Expected: `PERMISSION_DENIED`.
8. **Orphan Claim Injection**: User creates `/claims/c1` referencing non-existent `itemId: "missing_item"`. Expected: `PERMISSION_DENIED`.
9. **Claim Self-Approval**: Claimant updates `/claims/c1` setting `status: "Approved"`. Expected: `PERMISSION_DENIED`.
10. **PII Blanket Scraping**: User `u1` attempts `getDoc` on `/users/u2`. Expected: `PERMISSION_DENIED`.
11. **Terminal State Bypass**: Reporter updates an already `Returned` item `/items/item1` back to `Lost`. Expected: `PERMISSION_DENIED`.
12. **Cross-User Notification Tampering**: User `u1` updates `read: true` on `/notifications/n_for_u2`. Expected: `PERMISSION_DENIED`.
