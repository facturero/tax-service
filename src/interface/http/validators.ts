import { zValidator } from '@hono/zod-validator';
import { z, ZodSchema } from 'zod';
import { ValidationError } from '../../domain/errors';

export const enableCountrySchema = z.object({
  code: z.string().length(2, 'El código de país debe tener 2 caracteres.'),
  name: z.string().min(1, 'El nombre es obligatorio.').max(100),
  currencyCode: z.string().length(3, 'El código de moneda debe tener 3 caracteres.'),
  decimals: z.number().int().min(0).max(4).optional(),
});

export const updateCountrySchema = z.object({
  name: z.string().max(100).optional(),
  currencyCode: z.string().length(3).optional(),
  decimals: z.number().int().min(0).max(4).optional(),
  enabled: z.boolean().optional(),
});

export const upsertTaxRateSchema = z.object({
  code: z.string().min(1, 'El código es obligatorio.').max(20),
  name: z.string().min(1, 'El nombre es obligatorio.').max(100),
  percentage: z.number().min(0).max(100),
  kind: z.enum(['vat', 'withholding_iva', 'withholding_rent', 'special']),
  isDefault: z.boolean().optional(),
});

export const upsertIdentificationTypeSchema = z.object({
  code: z.string().min(1, 'El código es obligatorio.').max(20),
  name: z.string().min(1, 'El nombre es obligatorio.').max(100),
  regex: z.string().max(255).optional(),
});

export const upsertDocumentTypeSchema = z.object({
  code: z.string().min(1, 'El código es obligatorio.').max(20),
  name: z.string().min(1, 'El nombre es obligatorio.').max(100),
});

export function validateJson<T extends ZodSchema>(schema: T) {
  return zValidator('json', schema, (result) => {
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        field: i.path.join('.') || '(root)',
        message: i.message,
      }));
      throw new ValidationError(details);
    }
  });
}
