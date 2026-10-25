import type { RequestHandler } from 'express';
import { bodyOf, paramsOf, queryOf } from '../middleware/validate.js';
import * as patientService from '../services/patient.service.js';
import { idParams } from '../validators/common.js';
import { listPatientsQuery, updatePatientSchema } from '../validators/patient.validators.js';

export const list: RequestHandler = async (req, res) => {
  res.json(await patientService.listPatients(queryOf(req, listPatientsQuery)));
};

export const update: RequestHandler = async (req, res) => {
  const patient = await patientService.updatePatient(
    paramsOf(req, idParams).id,
    bodyOf(req, updatePatientSchema),
  );
  res.json({ data: patient });
};

export const destroy: RequestHandler = async (req, res) => {
  res.json({ data: await patientService.deletePatient(paramsOf(req, idParams).id) });
};
