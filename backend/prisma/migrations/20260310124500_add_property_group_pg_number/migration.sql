-- Add stable, incremental business identifier for property groups.
ALTER TABLE "property_groups"
ADD COLUMN "pgNumber" SERIAL;

ALTER TABLE "property_groups"
ALTER COLUMN "pgNumber" SET NOT NULL;

CREATE UNIQUE INDEX "property_groups_pgNumber_key"
ON "property_groups"("pgNumber");
