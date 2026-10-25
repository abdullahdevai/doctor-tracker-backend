import { Router } from 'express';
import * as doctors from '../controllers/doctor.controller.js';
import { validate } from '../middleware/validate.js';
import { doctorPatientParams, idParams } from '../validators/common.js';
import { createDoctorSchema, listDoctorsQuery } from '../validators/doctor.validators.js';
import {
  createPatientForDoctorSchema,
  listPatientsQuery,
} from '../validators/patient.validators.js';

export const doctorRoutes = Router()
  .get('/', validate({ query: listDoctorsQuery }), doctors.list)
  .post('/', validate({ body: createDoctorSchema }), doctors.create)
  .get('/filters', doctors.filterOptions)
  .get('/:id', validate({ params: idParams }), doctors.show)
  .get(
    '/:id/patients',
    validate({ params: idParams, query: listPatientsQuery }),
    doctors.listPatients,
  )
  .post(
    '/:id/patients',
    validate({ params: idParams, body: createPatientForDoctorSchema }),
    doctors.addPatient,
  )
  .delete(
    '/:id/patients/:patientId',
    validate({ params: doctorPatientParams }),
    doctors.removePatient,
  );
