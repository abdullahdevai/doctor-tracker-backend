import { z } from 'zod';
import { GENDERS, PATIENT_CONDITIONS } from '../models/Patient.js';
import {
  email,
  objectId,
  optionalDate,
  optionalEnum,
  pagination,
  personName,
  phone,
  searchText,
} from './common.js';

const patientFields = z.object({
  name: personName,
  age: z.coerce.number().int().min(0).max(130),
  gender: z.enum(GENDERS),
  phone,
  email: z.preprocess((v) => (v === '' ? null : v), email.nullable().optional()),
  condition: z.enum(PATIENT_CONDITIONS),
  diagnosis: z.string().trim().max(200).optional(),
  admittedAt: z.coerce
    .date()
    .refine((d) => d.getTime() <= Date.now() + 60_000, {
      message: 'Admission date cannot be in the future',
    })
    .optional(),
});

export const createPatientForDoctorSchema = patientFields.extend({
  condition: patientFields.shape.condition.default('stable'),
});

export const updatePatientSchema = patientFields
  .extend({ doctor: objectId })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: 'Provide at least one field to update' });

export const PATIENT_SORTS = ['newest', 'oldest', 'name', 'age'] as const;

export const listPatientsQuery = z
  .object({
    q: searchText,
    condition: optionalEnum(PATIENT_CONDITIONS),
    gender: optionalEnum(GENDERS),
    doctor: z.preprocess((v) => (v === '' ? undefined : v), objectId.optional()),
    from: optionalDate,
    to: optionalDate,
    sort: optionalEnum(PATIENT_SORTS).default('newest'),
    ...pagination,
  })
  .refine((v) => !v.from || !v.to || v.from <= v.to, {
    message: '`from` must be before `to`',
    path: ['from'],
  });

export type CreatePatientInput = z.infer<typeof createPatientForDoctorSchema> & { doctor: string };
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
export type ListPatientsQuery = z.infer<typeof listPatientsQuery>;
