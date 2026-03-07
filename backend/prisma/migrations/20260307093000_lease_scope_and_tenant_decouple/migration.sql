-- Expand Lease scope columns
ALTER TABLE "leases"
ADD COLUMN "propertyGroupId" TEXT,
ADD COLUMN "propertyId" TEXT;

-- Backfill from unit -> property
UPDATE "leases" AS l
SET
  "propertyId" = u."propertyId",
  "propertyGroupId" = p."propertyGroupId"
FROM "units" AS u
JOIN "properties" AS p ON p."id" = u."propertyId"
WHERE l."unitId" = u."id";

-- Enforce not null after backfill
ALTER TABLE "leases"
ALTER COLUMN "propertyGroupId" SET NOT NULL,
ALTER COLUMN "propertyId" SET NOT NULL;

-- Add foreign keys for new lease scope columns
ALTER TABLE "leases"
ADD CONSTRAINT "leases_propertyGroupId_fkey"
FOREIGN KEY ("propertyGroupId") REFERENCES "property_groups"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "leases"
ADD CONSTRAINT "leases_propertyId_fkey"
FOREIGN KEY ("propertyId") REFERENCES "properties"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- Add indexes for lease scope queries
CREATE INDEX "leases_propertyGroupId_status_idx" ON "leases"("propertyGroupId", "status");
CREATE INDEX "leases_propertyId_idx" ON "leases"("propertyId");

-- Contract tenant table: remove legacy propertyGroup scoping
DROP INDEX "tenants_propertyGroupId_status_idx";
ALTER TABLE "tenants" DROP CONSTRAINT "tenants_propertyGroupId_fkey";
ALTER TABLE "tenants" DROP COLUMN "propertyGroupId";

-- Keep status index for tenant filtering
CREATE INDEX "tenants_status_idx" ON "tenants"("status");
