import { Router } from 'express';
import * as patients from '../controllers/patient.controller.js';
import { validate } from '../middleware/validate.js';
import { idParams } from '../validators/common.js';
import { listPatientsQuery, updatePatientSchema } from '../validators/patient.validators.js';

export const patientRoutes = Router()
  .get('/', validate({ query: listPatientsQuery }), patients.list)
  .patch('/:id', validate({ params: idParams, body: updatePatientSchema }), patients.update)
  .delete('/:id', validate({ params: idParams }), patients.destroy);
