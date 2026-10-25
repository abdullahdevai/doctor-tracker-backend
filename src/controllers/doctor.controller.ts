import type { RequestHandler } from 'express';
import { bodyOf, paramsOf, queryOf } from '../middleware/validate.js';
import * as doctorService from '../services/doctor.service.js';
import * as patientService from '../services/patient.service.js';
import { doctorPatientParams, idParams } from '../validators/common.js';
import { createDoctorSchema, listDoctorsQuery } from '../validators/doctor.validators.js';
import {
  createPatientForDoctorSchema,
  listPatientsQuery,
} from '../validators/patient.validators.js';

export const list: RequestHandler = async (req, res) => {
  res.json(await doctorService.listDoctors(queryOf(req, listDoctorsQuery)));
};

export const filterOptions: RequestHandler = async (_req, res) => {
  res.json({ data: await doctorService.getDoctorFilterOptions() });
};

export const show: RequestHandler = async (req, res) => {
  res.json({ data: await doctorService.getDoctor(paramsOf(req, idParams).id) });
};

export const create: RequestHandler = async (req, res) => {
  const doctor = await doctorService.createDoctor(bodyOf(req, createDoctorSchema));
  res.status(201).json({ data: doctor });
};

export const listPatients: RequestHandler = async (req, res) => {
  const { id } = paramsOf(req, idParams);
  res.json(await patientService.listPatients(queryOf(req, listPatientsQuery), id));
};

export const addPatient: RequestHandler = async (req, res) => {
  const { id } = paramsOf(req, idParams);
  const patient = await patientService.createPatient({
    ...bodyOf(req, createPatientForDoctorSchema),
    doctor: id,
  });
  res.status(201).json({ data: patient });
};

export const removePatient: RequestHandler = async (req, res) => {
  const { id, patientId } = paramsOf(req, doctorPatientParams);
  res.json({ data: await patientService.deletePatient(patientId, id) });
};
