-- Fix appMode for registered users
UPDATE "User"
SET "appMode" = 'FREE'
WHERE "role" = 'USER'
  AND "appMode" = 'GUEST'
  AND "email" IS NOT NULL;

-- Show updated users
SELECT "id", "email", "username", "appMode", "freeGenerationsRemaining", "freeGenerationsUsed"
FROM "User"
WHERE "role" = 'USER';
