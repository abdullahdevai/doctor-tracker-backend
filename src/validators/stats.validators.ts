import { z } from 'zod';
import { optionalEnum } from './common.js';

export const STATS_RANGES = ['7d', '30d', '90d', '12m'] as const;

export const timeseriesQuery = z.object({
  range: optionalEnum(STATS_RANGES).default('30d'),
});

export type StatsRange = (typeof STATS_RANGES)[number];
