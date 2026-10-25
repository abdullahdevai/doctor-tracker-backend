import { Router } from 'express';
import * as stats from '../controllers/stats.controller.js';
import { validate } from '../middleware/validate.js';
import { timeseriesQuery } from '../validators/stats.validators.js';

export const statsRoutes = Router()
  .get('/overview', stats.overview)
  .get('/timeseries', validate({ query: timeseriesQuery }), stats.timeseries);
