import { Types } from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../src/config/db.js';
import { env } from '../src/config/env.js';
import { DoctorModel } from '../src/models/Doctor.js';
import { PatientModel, PATIENT_CONDITIONS } from '../src/models/Patient.js';
import { UserModel } from '../src/models/User.js';
import { hashPassword } from '../src/services/auth.service.js';
import { buildSearchTokens } from '../src/utils/search.js';

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
const DOCTOR_COUNT = Number(arg('doctors') ?? 8);
const PATIENT_COUNT = Number(arg('patients') ?? 10);

let state = 0x5eed;
const rand = () => {
  state |= 0;
  state = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(state ^ (state >>> 15), 1 | state);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)]!;
const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
const weighted = <T>(entries: readonly (readonly [T, number])[]): T => {
  let r = rand() * entries.reduce((s, [, w]) => s + w, 0);
  for (const [v, w] of entries) if ((r -= w) <= 0) return v;
  return entries[0]![0];
};

const FIRST_F = [
  'Ayesha',
  'Nusrat',
  'Farhana',
  'Sadia',
  'Maria',
  'Olivia',
  'Sophia',
  'Emma',
  'Priya',
  'Leila',
  'Grace',
  'Zara',
  'Mina',
  'Hana',
  'Sara',
];
const FIRST_M = [
  'Rahim',
  'Tanvir',
  'Imran',
  'Kamal',
  'James',
  'Liam',
  'Noah',
  'Arjun',
  'Hassan',
  'Daniel',
  'Omar',
  'Ethan',
  'Lucas',
  'Ravi',
  'Yusuf',
];
const FIRST = [...FIRST_F, ...FIRST_M];
const LAST = [
  'Rahman',
  'Chowdhury',
  'Hossain',
  'Ahmed',
  'Islam',
  'Karim',
  'Smith',
  'Johnson',
  'Patel',
  'Khan',
  'Garcia',
  'Nguyen',
  'Kim',
  'Brown',
  'Haque',
  'Siddiqui',
  'Lee',
  'Martin',
  'Das',
  'Roy',
  'Wilson',
  'Clark',
];
const SPECIALIZATIONS = [
  'Cardiology',
  'Neurology',
  'Orthopedics',
  'Pediatrics',
  'Dermatology',
  'Oncology',
  'General Medicine',
  'Gynecology',
  'Psychiatry',
  'ENT',
];
const HOSPITALS = [
  'City General Hospital',
  'Green Life Medical Center',
  'United Hospital',
  'Square Hospital',
  'Evercare Hospital',
  'Labaid Specialized',
];
const DIAGNOSES: Record<string, string[]> = {
  Cardiology: ['Hypertension', 'Arrhythmia', 'Coronary artery disease', 'Heart failure'],
  Neurology: ['Migraine', 'Epilepsy', 'Stroke recovery', 'Peripheral neuropathy'],
  Orthopedics: ['Fractured tibia', 'ACL tear', 'Osteoarthritis', 'Lower back pain'],
  Pediatrics: ['Bronchiolitis', 'Asthma', 'Viral fever', 'Otitis media'],
  Dermatology: ['Eczema', 'Psoriasis', 'Acne vulgaris', 'Fungal infection'],
  Oncology: ['Breast cancer', 'Lymphoma', 'Lung carcinoma', 'Leukemia'],
  'General Medicine': ['Type 2 diabetes', 'Dengue fever', 'Gastritis', 'Pneumonia'],
  Gynecology: ['PCOS', 'Prenatal care', 'Endometriosis', 'Anemia in pregnancy'],
  Psychiatry: ['Generalized anxiety', 'Major depression', 'Insomnia', 'Bipolar disorder'],
  ENT: ['Chronic sinusitis', 'Tonsillitis', 'Hearing loss', 'Vertigo'],
};
const CONDITION_WEIGHTS = [
  ['stable', 35],
  ['recovering', 25],
  ['under_observation', 18],
  ['critical', 9],
  ['discharged', 13],
] as const satisfies readonly (readonly [(typeof PATIENT_CONDITIONS)[number], number])[];

const DAY = 86_400_000;
const phone = () => `+8801${int(3, 9)}${String(int(0, 99_999_999)).padStart(8, '0')}`;
const slug = (s: string) => s.toLowerCase().replace(/[^a-z]+/g, '');

async function main() {
  if (env.isProd && !process.argv.includes('--force')) {
    throw new Error('Refusing to wipe a production database. Pass --force if you really mean it.');
  }

  await connectDatabase();
  await Promise.all([
    UserModel.deleteMany({}),
    DoctorModel.deleteMany({}),
    PatientModel.deleteMany({}),
  ]);
  await Promise.all([
    UserModel.syncIndexes(),
    DoctorModel.syncIndexes(),
    PatientModel.syncIndexes(),
  ]);

  await UserModel.create({
    name: process.env.SEED_ADMIN_NAME ?? 'Admin User',
    email: process.env.SEED_ADMIN_EMAIL ?? 'admin@doctortracker.dev',
    password: await hashPassword(process.env.SEED_ADMIN_PASSWORD ?? 'Admin@12345'),
    role: 'admin',
  });

  const now = Date.now();
  const doctors = Array.from({ length: DOCTOR_COUNT }, (_, i) => {
    const first = pick(FIRST);
    const last = pick(LAST);
    const name = `${first} ${last}`;
    const specialization = SPECIALIZATIONS[i % SPECIALIZATIONS.length]!;
    const hospital = pick(HOSPITALS);
    const email = `${slug(first)}.${slug(last)}${i + 1}@${slug(hospital)}.health`;
    const doctorPhone = phone();
    const createdAt = new Date(now - Math.floor(Math.pow(rand(), 0.7) * 420 * DAY));
    return {
      _id: new Types.ObjectId(),
      name,
      specialization,
      hospital,
      phone: doctorPhone,
      email,
      patientCount: 0,
      searchTokens: buildSearchTokens(name, specialization, hospital, email, doctorPhone),
      createdAt,
      updatedAt: createdAt,
    };
  });

  const doctorWeights = doctors.map(() => 0.3 + Math.pow(rand(), 2) * 3);
  const totalWeight = doctorWeights.reduce((s, w) => s + w, 0);
  const pickDoctor = () => {
    let r = rand() * totalWeight;
    for (let i = 0; i < doctors.length; i++) if ((r -= doctorWeights[i]!) <= 0) return doctors[i]!;
    return doctors.at(-1)!;
  };

  const patients = Array.from({ length: PATIENT_COUNT }, () => {
    const doctor = pickDoctor();
    doctor.patientCount++;
    const gender = weighted([
      ['female', 49],
      ['male', 49],
      ['other', 2],
    ] as const);
    const name = `${pick(gender === 'male' ? FIRST_M : gender === 'female' ? FIRST_F : FIRST)} ${pick(LAST)}`;
    const span = Math.max(DAY, now - doctor.createdAt.getTime());
    const admittedAt = new Date(now - Math.floor(Math.pow(rand(), 1.25) * span));
    const email = rand() > 0.3 ? `${slug(name)}${int(1, 999)}@mail.com` : undefined;
    const diagnosis = pick(DIAGNOSES[doctor.specialization]!);
    const patientPhone = phone();
    return {
      _id: new Types.ObjectId(),
      name,
      age: doctor.specialization === 'Pediatrics' ? int(0, 17) : int(18, 88),
      gender,
      phone: patientPhone,
      ...(email && { email }),
      condition: weighted(CONDITION_WEIGHTS),
      diagnosis,
      admittedAt,
      doctor: doctor._id,
      searchTokens: buildSearchTokens(name, patientPhone, email, diagnosis),
      createdAt: admittedAt,
      updatedAt: admittedAt,
    };
  });

  await DoctorModel.collection.insertMany(doctors);
  for (let i = 0; i < patients.length; i += 5000) {
    await PatientModel.collection.insertMany(patients.slice(i, i + 5000), { ordered: false });
  }

  console.info(`Seeded 1 admin, ${doctors.length} doctors, ${patients.length} patients`);
  console.info(
    `   Login: ${process.env.SEED_ADMIN_EMAIL ?? 'admin@doctortracker.dev'} / ${process.env.SEED_ADMIN_PASSWORD ?? 'Admin@12345'}`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(disconnectDatabase);
