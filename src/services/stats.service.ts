import { DoctorModel } from '../models/Doctor.js';
import { PatientModel } from '../models/Patient.js';
import type { StatsRange } from '../validators/stats.validators.js';

const startOfUtcMonth = (d: Date, offset = 0) =>
  new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + offset, 1));

export async function getOverview() {
  const now = new Date();
  const thisMonth = startOfUtcMonth(now);
  const lastMonth = startOfUtcMonth(now, -1);

  const [doctors, patients, admittedThisMonth, admittedLastMonth, patientsPerDoctor] =
    await Promise.all([
      DoctorModel.estimatedDocumentCount(),
      PatientModel.estimatedDocumentCount(),
      PatientModel.countDocuments({ admittedAt: { $gte: thisMonth } }),
      PatientModel.countDocuments({ admittedAt: { $gte: lastMonth, $lt: thisMonth } }),
      DoctorModel.find({}, 'name specialization patientCount')
        .sort({ patientCount: -1, _id: 1 })
        .limit(10)
        .lean(),
    ]);

  return {
    totals: {
      doctors,
      patients,
      admittedThisMonth,
      admittedLastMonth,
      avgPatientsPerDoctor: doctors ? Math.round((patients / doctors) * 10) / 10 : 0,
    },
    patientsPerDoctor: patientsPerDoctor.map((d) => ({
      _id: d._id,
      name: d.name,
      specialization: d.specialization,
      patientCount: d.patientCount,
    })),
  };
}

const RANGES: Record<StatsRange, { unit: 'day' | 'month'; size: number }> = {
  '7d': { unit: 'day', size: 7 },
  '30d': { unit: 'day', size: 30 },
  '90d': { unit: 'day', size: 90 },
  '12m': { unit: 'month', size: 12 },
};

function buildBuckets(unit: 'day' | 'month', size: number): Date[] {
  const now = new Date();
  const buckets: Date[] = [];
  for (let i = size - 1; i >= 0; i--) {
    buckets.push(
      unit === 'day'
        ? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i))
        : startOfUtcMonth(now, -i),
    );
  }
  return buckets;
}

export async function getTimeseries(range: StatsRange) {
  const { unit, size } = RANGES[range];
  const buckets = buildBuckets(unit, size);
  const start = buckets[0]!;
  const bucketExpr = (field: string) => ({ $dateTrunc: { date: field, unit, timezone: 'UTC' } });

  const [admissions, doctors] = await Promise.all([
    PatientModel.aggregate<{ _id: Date; count: number }>([
      { $match: { admittedAt: { $gte: start } } },
      { $group: { _id: bucketExpr('$admittedAt'), count: { $sum: 1 } } },
    ]),
    DoctorModel.aggregate<{ _id: Date; count: number }>([
      { $match: { createdAt: { $gte: start } } },
      { $group: { _id: bucketExpr('$createdAt'), count: { $sum: 1 } } },
    ]),
  ]);

  const admissionsBy = new Map(admissions.map((a) => [a._id.getTime(), a.count]));
  const doctorsBy = new Map(doctors.map((d) => [d._id.getTime(), d.count]));

  const points = buckets.map((date) => ({
    date: date.toISOString(),
    admissions: admissionsBy.get(date.getTime()) ?? 0,
    newDoctors: doctorsBy.get(date.getTime()) ?? 0,
  }));

  return {
    range,
    unit,
    points,
    summary: {
      admissions: points.reduce((s, p) => s + p.admissions, 0),
      newDoctors: points.reduce((s, p) => s + p.newDoctors, 0),
    },
  };
}
