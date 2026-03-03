import { z } from 'zod';

export const overridePlanSchema = z.object({
  plan: z.enum(['FREE', 'BASIC', 'PRO'], { message: 'Select a plan' }),
});
export type OverridePlanDto = z.infer<typeof overridePlanSchema>;

export const extendSubscriptionSchema = z.object({
  newPeriodEnd: z.string().min(1, 'Select a date'),
});
export type ExtendSubscriptionDto = z.infer<typeof extendSubscriptionSchema>;

export const changeUserTypeSchema = z.object({
  userType: z.enum(['SYSTEM_ADMIN', 'LANDLORD', 'TENANT']),
});
export type ChangeUserTypeDto = z.infer<typeof changeUserTypeSchema>;

export const suspendOrgSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED']),
  reason: z.string().optional(),
});
export type SuspendOrgDto = z.infer<typeof suspendOrgSchema>;

export const addonSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    category: z.enum([
      'internet',
      'utility',
      'parking',
      'laundry',
      'security',
      'pet',
      'amenity',
    ]),
    billingType: z.enum(['FIXED_AMENITY', 'FLAT_FEE', 'METERED']),
    defaultRate: z.number().positive().optional(),
    unitOfMeasure: z.string().optional(),
  })
  .refine((d) => d.billingType !== 'METERED' || !!d.unitOfMeasure, {
    message: 'Unit of measure is required for metered add-ons',
    path: ['unitOfMeasure'],
  });
export type AddonDto = z.infer<typeof addonSchema>;
