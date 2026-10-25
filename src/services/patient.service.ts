import { Types, type QueryFilter } from 'mongoose';
import { DoctorModel } from '../models/Doctor.js';
import { PatientModel, type Patient } from '../models/Patient.js';
import { ApiError } from '../utils/ApiError.js';
import { buildMeta, dateRangeFilter, skipFor } from '../utils/pagination.js';
import { buildSearchTokens, searchFilter } from '../utils/search.js';
import type {
  CreatePatientInput,
  ListPatientsQuery,
  UpdatePatientInput,
} from '../validators/patient.validators.js';

const SORTS = {
  newest: { admittedAt: -1, _id: -1 },
  oldest: { admittedAt: 1, _id: 1 },
  name: { name: 1, _id: 1 },
  age: { age: -1, _id: -1 },
} as const;

const DOCTOR_FIELDS = 'name specialization hospital';

const tokensFor = (p: {
  name: string;
  phone: string;
  email?: string | null;
  diagnosis?: string | null;
}) => buildSearchTokens(p.name, p.phone, p.email, p.diagnosis);

const withoutTokens = <T extends { searchTokens?: unknown }>(doc: T) => {
  const { searchTokens: _omit, ...rest } = doc;
  return rest;
};

async function assertDoctorExists(id: string) {
  if (!(await DoctorModel.exists({ _id: id }))) throw ApiError.notFound('Doctor');
}

const bumpPatientCount = (doctorId: string | Types.ObjectId, by: 1 | -1) =>
  DoctorModel.updateOne({ _id: doctorId }, { $inc: { patientCount: by } });

export async function listPatients(query: ListPatientsQuery, doctorId?: string) {
  const filter: QueryFilter<Patient> = { ...searchFilter(query.q) };
  const doctor = doctorId ?? query.doctor;
  if (doctor) filter.doctor = new Types.ObjectId(doctor);
  if (query.condition) filter.condition = query.condition;
  if (query.gender) filter.gender = query.gender;
  const admittedAt = dateRangeFilter(query.from, query.to);
  if (admittedAt) filter.admittedAt = admittedAt;

  const [data, total] = await Promise.all([
    PatientModel.find(filter)
      .sort(SORTS[query.sort])
      .skip(skipFor(query))
      .limit(query.limit)
      .populate('doctor', DOCTOR_FIELDS)
      .lean(),
    PatientModel.countDocuments(filter),
  ]);

  return { data, meta: buildMeta(query, total) };
}

export async function createPatient(input: CreatePatientInput) {
  await assertDoctorExists(input.doctor);

  const patient = await PatientModel.create({ ...input, searchTokens: tokensFor(input) });
  await bumpPatientCount(input.doctor, 1);

  await patient.populate('doctor', DOCTOR_FIELDS);
  return withoutTokens(patient.toObject());
}

export async function updatePatient(id: string, input: UpdatePatientInput) {
  const patient = await PatientModel.findById(id);
  if (!patient) throw ApiError.notFound('Patient');

  const previousDoctor = patient.doctor;
  const doctorChanged = input.doctor !== undefined && !previousDoctor.equals(input.doctor);
  if (doctorChanged) await assertDoctorExists(input.doctor!);

  patient.set(input);
  patient.searchTokens = tokensFor(patient);
  await patient.save();

  if (doctorChanged) {
    await DoctorModel.bulkWrite([
      { updateOne: { filter: { _id: previousDoctor }, update: { $inc: { patientCount: -1 } } } },
      { updateOne: { filter: { _id: patient.doctor }, update: { $inc: { patientCount: 1 } } } },
    ]);
  }

  await patient.populate('doctor', DOCTOR_FIELDS);
  return withoutTokens(patient.toObject());
}

export async function deletePatient(id: string, scopeDoctorId?: string) {
  const filter: QueryFilter<Patient> = { _id: id };
  if (scopeDoctorId) filter.doctor = new Types.ObjectId(scopeDoctorId);

  const deleted = await PatientModel.findOneAndDelete(filter).lean();
  if (!deleted) throw ApiError.notFound('Patient');

  await bumpPatientCount(deleted.doctor, -1);
  return { id: String(deleted._id) };
}
