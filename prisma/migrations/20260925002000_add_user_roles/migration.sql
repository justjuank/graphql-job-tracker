-- Existing users begin as regular users; the local demo account is the admin.
ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'USER';

UPDATE "User"
SET "role" = 'ADMIN'
WHERE "id" = 'user-1';
