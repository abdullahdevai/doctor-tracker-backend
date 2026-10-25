import { connectDatabase, disconnectDatabase } from '../src/config/db.js';
import { DoctorModel } from '../src/models/Doctor.js';
import { PatientModel } from '../src/models/Patient.js';
import { UserModel } from '../src/models/User.js';

await connectDatabase();
for (const model of [UserModel, DoctorModel, PatientModel]) {
  const dropped = await model.syncIndexes();
  const current = await model.listIndexes();
  console.info(
    `${model.modelName}: ${current.map((i) => i.name).join(', ')}${dropped.length ? ` (dropped: ${dropped.join(', ')})` : ''}`,
  );
}
await disconnectDatabase();
