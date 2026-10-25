import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UserModel } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import type { LoginInput } from '../validators/auth.validators.js';

interface TokenPayload {
  sub: string;
  role: string;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

const DUMMY_HASH = bcrypt.hashSync('timing-safe-dummy-password', 10);

export const hashPassword = (plain: string) => bcrypt.hash(plain, 12);

export function signToken(user: { id: string; role: string }): string {
  return jwt.sign({ role: user.role } satisfies Omit<TokenPayload, 'sub'>, env.JWT_SECRET, {
    subject: user.id,
    expiresIn: env.JWT_TTL_SECONDS,
    algorithm: 'HS256',
  });
}

export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
  if (typeof decoded === 'string' || !decoded.sub) throw ApiError.unauthorized('Invalid session');
  return { sub: decoded.sub, role: String(decoded.role) };
}

export async function login({
  email,
  password,
}: LoginInput): Promise<{ user: PublicUser; token: string }> {
  const user = await UserModel.findOne({ email }).select('+password').lean();
  const ok = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);

  if (!user || !ok) throw new ApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');

  const publicUser = {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role ?? 'admin',
  };
  return { user: publicUser, token: signToken(publicUser) };
}

export async function getUserById(id: string): Promise<PublicUser> {
  const user = await UserModel.findById(id).lean();
  if (!user) throw ApiError.unauthorized('Account no longer exists');
  return { id: String(user._id), name: user.name, email: user.email, role: user.role ?? 'admin' };
}
