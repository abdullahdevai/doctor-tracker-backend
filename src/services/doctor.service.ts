import type { QueryFilter } from 'mongoose';
import { DoctorModel, type Doctor } from '../models/Doctor.js';
import { ApiError } from '../utils/ApiError.js';
import { buildMeta, dateRangeFilter, skipFor } from '../utils/pagination.js';
import { buildSearchTokens, searchFilter } from '../utils/search.js';
import type { CreateDoctorInput, ListDoctorsQuery } from '../validators/doctor.validators.js';

const SORTS = {
  newest: { createdAt: -1, _id: -1 },
  oldest: { createdAt: 1, _id: 1 },
  name: { name: 1, _id: 1 },
  patients: { patientCount: -1, _id: -1 },
} as const;

const tokensFor = (d: Pick<Doctor, 'name' | 'specialization' | 'hospital' | 'email' | 'phone'>) =>
  buildSearchTokens(d.name, d.specialization, d.hospital, d.email, d.phone);

export async function listDoctors(query: ListDoctorsQuery) {
  const filter: QueryFilter<Doctor> = { ...searchFilter(query.q) };
  if (query.specialization) filter.specialization = query.specialization;
  if (query.hospital) filter.hospital = query.hospital;
  const createdAt = dateRangeFilter(query.from, query.to);
  if (createdAt) filter.createdAt = createdAt;

  const [data, total] = await Promise.all([
    DoctorModel.find(filter).sort(SORTS[query.sort]).skip(skipFor(query)).limit(query.limit).lean(),
    DoctorModel.countDocuments(filter),
  ]);

  return { data, meta: buildMeta(query, total) };
}

export async function getDoctor(id: string) {
  const doctor = await DoctorModel.findById(id).lean();
  if (!doctor) throw ApiError.notFound('Doctor');
  return doctor;
}

export async function createDoctor(input: CreateDoctorInput) {
  const doctor = await DoctorModel.create({ ...input, searchTokens: tokensFor(input) });
  const { searchTokens: _omit, ...rest } = doctor.toObject();
  return rest;
}

export async function getDoctorFilterOptions() {
  const [specializations, hospitals] = await Promise.all([
    DoctorModel.distinct('specialization'),
    DoctorModel.distinct('hospital'),
  ]);
  return {
    specializations: specializations.sort((a, b) => a.localeCompare(b)),
    hospitals: hospitals.sort((a, b) => a.localeCompare(b)),
  };
}
