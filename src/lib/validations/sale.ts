import { z } from "zod";

export const saleItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0),
  taxRate: z.number().min(0),
});

export const createSaleSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  saleDate: z.string().optional(),
  notes: z.string().max(1000).optional().default(""),
  items: z.array(saleItemSchema).min(1, "At least one item is required"),
});

export const createPaymentSchema = z.object({
  saleId: z.string().min(1, "Sale is required"),
  amount: z.number().min(0.01, "Amount must be positive"),
  method: z.enum(["CASH", "BANK_TRANSFER", "UPI", "CHEQUE"]).optional().default("CASH"),
  referenceNumber: z.string().max(100).optional().default(""),
  notes: z.string().max(500).optional().default(""),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type SaleItemInput = z.infer<typeof saleItemSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
