import httpStatus from 'http-status';
import AppError from '@/errors/app-error';
import { prisma } from '@/lib/prisma';
import { calculatePagination, IPaginationOptions } from '@/utils/pagination';
import {
  JobStatus,
  JobType,
  JobLocation,
} from '../../../prisma/generated/prisma/enums';
import { Prisma } from '../../../prisma/generated/prisma/client';

interface CreateJobPayload {
  company_name?: string;
  title: string;
  job_type: JobType;
  job_location: JobLocation;
  description: string;
  status?: JobStatus;
  user_id: string;
}

interface UpdateJobPayload {
  company_name?: string;
  title?: string;
  job_type?: JobType;
  job_location?: JobLocation;
  description?: string;
  status?: JobStatus;
}

interface GetJobsQuery extends IPaginationOptions {
  search?: string;
  status?: JobStatus;
  job_type?: JobType;
  job_location?: JobLocation;
  user_id?: string;
}

/**
 * Create a new job
 */
const createJob = async (payload: CreateJobPayload) => {
  const { user_id, ...jobData } = payload;

  // Verify user exists and is active
  const user = await prisma.user.findUnique({
    where: { id: user_id },
    select: { id: true, is_active: true, is_deleted: true },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (user.is_deleted || !user.is_active) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Cannot create job with inactive or deleted account',
    );
  }

  const job = await prisma.job.create({
    data: {
      ...jobData,
      user_id,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          candidates: true,
        },
      },
    },
  });

  return job;
};

/**
 * Get job by ID
 */
const getJobById = async (jobId: string) => {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          candidates: true,
        },
      },
    },
  });

  if (!job) {
    throw new AppError(httpStatus.NOT_FOUND, 'Job not found');
  }

  return job;
};

/**
 * Get all jobs with search, filter, sort, and pagination
 */
const getJobs = async (query: GetJobsQuery) => {
  const {
    page,
    limit,
    sort_by,
    sort_order,
    search,
    status,
    job_type,
    job_location,
    user_id,
  } = query;

  // Calculate pagination
  const paginationOptions = calculatePagination({
    page,
    limit,
    sort_by,
    sort_order,
  });

  // Build where clause for filtering
  const where: Prisma.JobWhereInput = {};

  // Filter by status
  if (status) {
    where.status = status;
  }

  // Filter by job type
  if (job_type) {
    where.job_type = job_type;
  }

  // Filter by job location
  if (job_location) {
    where.job_location = job_location;
  }

  // Filter by user_id
  if (user_id) {
    where.user_id = user_id;
  }

  // Search functionality - search in title, company_name, and description
  if (search) {
    where.OR = [
      {
        title: {
          contains: search,
          mode: Prisma.QueryMode.insensitive,
        },
      },
      {
        company_name: {
          contains: search,
          mode: Prisma.QueryMode.insensitive,
        },
      },
      {
        description: {
          contains: search,
          mode: Prisma.QueryMode.insensitive,
        },
      },
    ];
  }

  // Build orderBy clause
  const orderBy: Prisma.JobOrderByWithRelationInput = {};

  // Map sort_by to Prisma field names
  const sortFieldMap: Record<string, string> = {
    created_at: 'created_at',
    updated_at: 'updated_at',
    title: 'title',
    company_name: 'company_name',
  };

  const sortField = sortFieldMap[paginationOptions.sort_by] || 'created_at';
  orderBy[sortField as keyof Prisma.JobOrderByWithRelationInput] =
    paginationOptions.sort_order as Prisma.SortOrder;

  // Execute query with pagination
  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      orderBy,
      skip: paginationOptions.skip,
      take: paginationOptions.limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            candidates: true,
          },
        },
      },
    }),
    prisma.job.count({ where }),
  ]);

  return {
    data: jobs,
    meta: {
      page: paginationOptions.page,
      limit: paginationOptions.limit,
      total,
      totalPages: Math.ceil(total / paginationOptions.limit),
    },
  };
};

/**
 * Update job by ID
 */
const updateJob = async (
  jobId: string,
  userId: string,
  payload: UpdateJobPayload,
) => {
  // Check if job exists
  const existingJob = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!existingJob) {
    throw new AppError(httpStatus.NOT_FOUND, 'Job not found');
  }

  // Check if user owns the job
  if (existingJob.user_id !== userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'You do not have permission to update this job',
    );
  }

  // Update job
  const job = await prisma.job.update({
    where: { id: jobId },
    data: payload,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          candidates: true,
        },
      },
    },
  });

  return job;
};

/**
 * Delete job by ID
 */
const deleteJob = async (jobId: string, userId: string) => {
  // Check if job exists
  const existingJob = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!existingJob) {
    throw new AppError(httpStatus.NOT_FOUND, 'Job not found');
  }

  // Check if user owns the job
  if (existingJob.user_id !== userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'You do not have permission to delete this job',
    );
  }

  // Delete job (cascade will handle related records)
  await prisma.job.delete({
    where: { id: jobId },
  });

  return {
    message: 'Job deleted successfully',
  };
};

/**
 * Get jobs by user ID (for user's own jobs)
 */
const getJobsByUserId = async (userId: string, query: GetJobsQuery) => {
  return getJobs({
    ...query,
    user_id: userId,
  });
};

const JobService = {
  createJob,
  getJobById,
  getJobs,
  updateJob,
  deleteJob,
  getJobsByUserId,
};

export default JobService;
