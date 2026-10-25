import { Schema, model, type InferSchemaType } from 'mongoose';

export const USER_ROLES = ['admin'] as const;

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: USER_ROLES, default: 'admin' },
  },
  { timestamps: true, versionKey: false },
);

export type User = InferSchemaType<typeof userSchema>;

export const UserModel = model('User', userSchema);
