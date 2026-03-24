import { z } from "zod";

export const overridePlanSchema = z.object({
  plan: z.enum(["FREE", "BASIC", "PRO"], { message: "Select a plan" }),
});
export type OverridePlanDto = z.infer<typeof overridePlanSchema>;

export const extendSubscriptionSchema = z.object({
  newPeriodEnd: z.string().min(1, "Select a date"),
});
export type ExtendSubscriptionDto = z.infer<typeof extendSubscriptionSchema>;

export const changeUserTypeSchema = z.object({
  userType: z.enum(["SYSTEM_ADMIN", "LANDLORD", "TENANT"]),
});
export type ChangeUserTypeDto = z.infer<typeof changeUserTypeSchema>;

export const suspendOrgSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED"]),
  reason: z.string().optional(),
});
export type SuspendOrgDto = z.infer<typeof suspendOrgSchema>;

export const addonSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    category: z.enum([
      "internet",
      "utility",
      "parking",
      "laundry",
      "security",
      "pet",
      "amenity",
    ]),
    billingType: z.enum(["FIXED_AMENITY", "FLAT_FEE", "METERED"]),
    defaultRate: z.number().positive().optional(),
    unitOfMeasure: z.string().optional(),
  })
  .refine((d) => d.billingType !== "METERED" || !!d.unitOfMeasure, {
    message: "Unit of measure is required for metered add-ons",
    path: ["unitOfMeasure"],
  });
export type AddonDto = z.infer<typeof addonSchema>;

export const subscriptionPlanSchema = z.object({
  name: z.string().min(1, "Plan name is required"),
  priceMonthly: z.number().min(0, "Monthly price must be 0 or more"),
  maxUnits: z.number().int().min(0, "Max units must be 0 or more"),
  maxUnitsPerProperty: z
    .number()
    .int()
    .min(0, "Max units per property must be 0 or more"),
  maxProperties: z.number().int().min(0, "Max properties must be 0 or more"),
  maxTenants: z.number().int().min(0, "Max tenants must be 0 or more"),
  menuCodes: z.array(z.string()).default([]),
  permissionCodes: z.array(z.string()).default([]),
});
export type SubscriptionPlanDto = z.infer<typeof subscriptionPlanSchema>;
