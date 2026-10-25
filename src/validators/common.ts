import { z } from 'zod';
import { isValidObjectId } from 'mongoose';

export const objectId = z.string().refine((v) => isValidObjectId(v), { message: 'Invalid id' });

export const idParams = z.object({ id: objectId });

export const doctorPatientParams = z.object({ id: objectId, patientId: objectId });

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

export const searchText = optionalText(100);

export const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z.preprocess((v) => (v === '' ? undefined : v), z.enum(values).optional());

export const optionalDate = z.preprocess(
  (v) => (v === '' || v == null ? undefined : v),
  z.coerce.date({ message: 'Invalid date' }).optional(),
);

export const pagination = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
};

export const phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9\s\-().]{7,20}$/, 'Enter a valid phone number');

export const personName = z.string().trim().min(2, 'Too short').max(100);

export const email = z.string().trim().toLowerCase().pipe(z.email('Enter a valid email'));
