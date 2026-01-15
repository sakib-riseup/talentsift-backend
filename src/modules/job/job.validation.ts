import { z } from 'zod';
import {
  JobStatus,
  JobType,
  JobLocation,
} from '../../../prisma/generated/prisma/enums';

// Create job validation
export const createJobSchema = z.object({
  body: z.object({
    company_name: z.string().min(1, 'Company name is required').optional(),
    title: z.string().min(1, 'Job title is required'),
    job_type: z.nativeEnum(JobType, {
      errorMap: () => ({ message: 'Invalid job type' }),
    }),
    job_location: z.nativeEnum(JobLocation, {
      errorMap: () => ({ message: 'Invalid job location' }),
    }),
    description: z
      .string()
      .min(10, 'Description must be at least 10 characters'),
    status: z.nativeEnum(JobStatus).optional().default(JobStatus.DRAFT),
  }),
});

// Update job validation
export const updateJobSchema = z.object({
  body: z.object({
    company_name: z.string().min(1).optional(),
    title: z.string().min(1).optional(),
    job_type: z.nativeEnum(JobType).optional(),
    job_location: z.nativeEnum(JobLocation).optional(),
    description: z.string().min(10).optional(),
    status: z.nativeEnum(JobStatus).optional(),
  }),
  params: z.object({
    id: z.string().min(1, 'Job ID is required'),
  }),
});

// Get job by ID validation
export const getJobByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Job ID is required'),
  }),
});

// Delete job validation
export const deleteJobSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Job ID is required'),
  }),
});

// List jobs with search, filter, sort, pagination
export const getJobsSchema = z.object({
  query: z.object({
    // Pagination
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined)),

    // Sorting
    sort_by: z
      .enum(['created_at', 'updated_at', 'title', 'company_name'])
      .optional(),
    sort_order: z.enum(['asc', 'desc']).optional(),

    // Search
    search: z.string().optional(),

    // Filters
    status: z.nativeEnum(JobStatus).optional(),
    job_type: z.nativeEnum(JobType).optional(),
    job_location: z.nativeEnum(JobLocation).optional(),
    user_id: z.string().optional(),
  }),
});
