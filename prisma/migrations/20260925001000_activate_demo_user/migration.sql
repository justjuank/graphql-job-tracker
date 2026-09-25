-- Give the preserved local demo user the same password as a fresh seed.
-- The WHERE clause leaves accounts that were already assigned a real hash alone.
UPDATE "User"
SET "passwordHash" = 'scrypt:00112233445566778899aabbccddeeff:5206c0434ff2dd910412928780623c2a9fb86f1a30b80f5e047462a23b0296eb759badc69accf84fa744f15f070e19ae676dd972f59474261d5ca66ea894721b'
WHERE "id" = 'user-1'
  AND "passwordHash" = 'replace-by-running-db-seed';
