import { z } from 'zod';
import {
  email,
  optionalDate,
  optionalEnum,
  pagination,
  personName,
  phone,
  searchText,
} from './common.js';

export const createDoctorSchema = z.object({
  name: personName,
  specialization: z.string().trim().min(2).max(80),
  hospital: z.string().trim().min(2).max(120),
  phone,
  email,
});

export const DOCTOR_SORTS = ['newest', 'oldest', 'name', 'patients'] as const;

export const listDoctorsQuery = z
  .object({
    q: searchText,
    specialization: searchText,
    hospital: searchText,
    from: optionalDate,
    to: optionalDate,
    sort: optionalEnum(DOCTOR_SORTS).default('newest'),
    ...pagination,
  })
  .refine((v) => !v.from || !v.to || v.from <= v.to, {
    message: '`from` must be before `to`',
    path: ['from'],
  });

export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;
export type ListDoctorsQuery = z.infer<typeof listDoctorsQuery>;
