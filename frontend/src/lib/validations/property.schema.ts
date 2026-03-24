import { z } from "zod";

const propertyTypes = [
  "BOARDING_HOUSE",
  "APARTMENT_BUILDING",
  "CONDO",
  "SINGLE_FAMILY",
  "COMMERCIAL_MIXED",
  "OTHER",
] as const;

export const createPropertySchema = z.object({
  propertyType: z.enum(propertyTypes),
  propertyName: z.string().min(1, "Property name is required").max(255),
  addressLine: z.string().min(1, "Address is required"),
  city: z.string().max(100),
  province: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
});

export const updatePropertySchema = createPropertySchema.partial();

export type CreatePropertyDto = z.infer<typeof createPropertySchema>;
export type UpdatePropertyDto = z.infer<typeof updatePropertySchema>;
