import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(1000).optional().default(""),
  sku: z.string().min(1, "SKU is required").max(50),
  barcode: z.string().max(50).optional().nullable(),
  categoryId: z.string().min(1, "Category is required"),
  taxRateId: z.string().min(1, "Tax rate is required"),
  costPrice: z.number().min(0, "Cost price must be positive"),
  sellingPrice: z.number().min(0, "Selling price must be positive"),
  stockQuantity: z.number().int().min(0).optional().default(0),
  minStockLevel: z.number().int().min(0).optional().default(10),
  unit: z.enum(["PIECE", "BOX", "KG", "LITER", "PACK", "CARTON"]).optional().default("PIECE"),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
