import { z } from 'zod';

export const propertyGroupSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(255),
  currencyCode: z.string().min(1, 'Currency is required').max(10),
  timezone: z.string().min(1, 'Timezone is required').max(100),
});

export const updatePropertyGroupSchema = propertyGroupSchema.partial();

export type PropertyGroupFormValues = z.infer<typeof propertyGroupSchema>;

