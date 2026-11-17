# Security Specification & Red Team Audit

## 1. Data Invariants
1. **Admin-Only Mutations**: Only verified administrators (`isAdmin()` with `request.auth.token.email_verified == true`) may create, update, or delete records in `/cosmetics`, `/cosmetic_images`, or `/admins`.
2. **Zero-PII Public Catalog**: `/cosmetics/{cosmeticId}` and `/cosmetic_images/{cosmeticId}` contain strictly product registration metadata and product photography — never user emails, phone numbers, or personal PII.
3. **Verification Integrity**: Only records explicitly marked `verifiedByAdmin == true` by an authorized admin can exist in `/cosmetics`. Unauthenticated or non-admin clients can never inject unverified or spoofed registrations.
4. **Strict Schema & Boundary Enforcement**: Every string field enforces both `minLength` and `maxLength` bounds; dates match `^[0-9]{4}-[0-9]{2}-[0-9]{2}$`; `status` is strictly one of `['valid', 'expired', 'suspended']`.
5. **Temporal Integrity**: `createdAt` and `updatedAt` are strictly validated against `request.time`; `createdAt` is immutable on updates.
6. **Path Variable Guarding**: All single-document operations enforce `isValidId(id)` (`^[a-zA-Z0-9_\-]+$`, max 128 chars).

## 2. Adversarial "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. Unauthenticated `create` on `/cosmetics/prod-1` -> DENIED (`!isAdmin()`).
2. Authenticated non-admin user `create` on `/cosmetics/prod-1` -> DENIED (`!isAdmin()`).
3. Admin email claim with `email_verified: false` -> DENIED (`email_verified == true` required).
4. Authenticated non-admin user `create` on `/admins/{ownUid}` (privilege escalation) -> DENIED.
5. Admin `create` on `/cosmetics/prod-1` with extra ghost field `isOfficialGov: true` -> DENIED (`keys().hasOnly(...)`).
6. Admin `create` on `/cosmetics/prod-1` with `verifiedByAdmin: false` -> DENIED (`verifiedByAdmin == true` enforced).
7. Admin `create` on `/cosmetics/prod-1` with invalid `status: "official"` -> DENIED (`status in ['valid', 'expired', 'suspended']`).
8. Admin `create` on `/cosmetics/prod-1` with client-spoofed `createdAt` timestamp != `request.time` -> DENIED.
9. Admin `update` on `/cosmetics/prod-1` mutating `createdAt` -> DENIED (`incoming().createdAt == existing().createdAt`).
10. Admin `create` on `/cosmetics/invalid.id$with*bad` (path ID poisoning) -> DENIED (`isValidId()`).
11. Admin `create` on `/cosmetics/prod-1` with `description` > 2000 chars (resource exhaustion) -> DENIED.
12. Unauthenticated or non-admin `list` on `/admins` or `/cosmetic_images` -> DENIED.
