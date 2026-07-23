# ClearPath Step 5: communications, certificates, and QR verification

This pack adds the security boundary for public certificate verification and the delivery boundary for notifications.

## Important integration work
1. Register `QrSigningService`, `PublicVerificationService`, `NotificationQueueService`, and `CertificateVerificationController` in the appropriate modules.
2. Add `QR_SIGNING_SECRET` to the runtime secret store.
3. Generate the signed QR code when issuing a certificate and persist it in `QRCode` or `Certificate.qrCodeUrl`.
4. Replace the queue placeholder with Bull/BullMQ and Redis before production. Add exponential backoff and a dead-letter queue.
5. Add SMTP/SMS/push adapters with provider timeouts, idempotency keys, delivery status, and redacted logs.
6. Add supertest coverage against a real test database.
