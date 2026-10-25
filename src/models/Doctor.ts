import { Schema, model, type InferSchemaType } from 'mongoose';

const doctorSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    specialization: { type: String, required: true, trim: true, maxlength: 80 },
    hospital: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    patientCount: { type: Number, default: 0, min: 0 },
    searchTokens: { type: [String], select: false },
  },
  { timestamps: true, versionKey: false },
);

doctorSchema.index({ createdAt: -1, _id: -1 });
doctorSchema.index({ specialization: 1, createdAt: -1 });
doctorSchema.index({ hospital: 1, createdAt: -1 });
doctorSchema.index({ patientCount: -1 });
doctorSchema.index({ searchTokens: 1, createdAt: -1 });

export type Doctor = InferSchemaType<typeof doctorSchema>;

export const DoctorModel = model('Doctor', doctorSchema);
