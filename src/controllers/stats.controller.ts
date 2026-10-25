import type { RequestHandler } from 'express';
import { queryOf } from '../middleware/validate.js';
import * as statsService from '../services/stats.service.js';
import { timeseriesQuery } from '../validators/stats.validators.js';

export const overview: RequestHandler = async (_req, res) => {
  res.json({ data: await statsService.getOverview() });
};

export const timeseries: RequestHandler = async (req, res) => {
  res.json({ data: await statsService.getTimeseries(queryOf(req, timeseriesQuery).range) });
};
