import { Schema, model, type InferSchemaType } from 'mongoose';

export const PATIENT_CONDITIONS = [
  'stable',
  'recovering',
  'under_observation',
  'critical',
  'discharged',
] as const;

export const GENDERS = ['male', 'female', 'other'] as const;

const patientSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    age: { type: Number, required: true, min: 0, max: 130 },
    gender: { type: String, enum: GENDERS, required: true },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    email: { type: String, lowercase: true, trim: true },
    condition: { type: String, enum: PATIENT_CONDITIONS, required: true, default: 'stable' },
    diagnosis: { type: String, trim: true, maxlength: 200 },
    admittedAt: { type: Date, required: true, default: () => new Date() },
    doctor: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    searchTokens: { type: [String], select: false },
  },
  { timestamps: true, versionKey: false },
);

patientSchema.index({ doctor: 1, admittedAt: -1 });
patientSchema.index({ condition: 1, admittedAt: -1 });
patientSchema.index({ admittedAt: -1, _id: -1 });
patientSchema.index({ searchTokens: 1, admittedAt: -1 });

export type Patient = InferSchemaType<typeof patientSchema>;

export const PatientModel = model('Patient', patientSchema);
