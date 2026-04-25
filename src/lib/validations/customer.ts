import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  businessName: z.string().max(200).optional().default(""),
  gstin: z.string().max(15).optional().nullable(),
  phone: z.string().max(15).optional().default(""),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().max(500).optional().default(""),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
