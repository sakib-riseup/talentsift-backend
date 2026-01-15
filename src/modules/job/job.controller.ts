import { Request, Response } from 'express';
import catchAsync from '@/utils/catch-async';
import sendResponse from '@/utils/send-response';
import httpStatus from 'http-status';
import JobService from './job.services';

/**
 * Create a new job
 * POST /api/v1/jobs
 */
const createJob = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: 'User not authenticated',
    });
  }

  const result = await JobService.createJob({
    ...req.body,
    user_id: userId,
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Job created successfully',
    data: result,
  });
});

/**
 * Get all jobs with search, filter, sort, and pagination
 * GET /api/v1/jobs
 */
const getJobs = catchAsync(async (req: Request, res: Response) => {
  const result = await JobService.getJobs(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Jobs retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

/**
 * Get job by ID
 * GET /api/v1/jobs/:id
 */
const getJobById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const jobId = Array.isArray(id) ? id[0] : id;

  const result = await JobService.getJobById(jobId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Job retrieved successfully',
    data: result,
  });
});

/**
 * Update job by ID
 * PATCH /api/v1/jobs/:id
 */
const updateJob = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params;
  const jobId = Array.isArray(id) ? id[0] : id;

  if (!userId) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: 'User not authenticated',
    });
  }

  const result = await JobService.updateJob(jobId, userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Job updated successfully',
    data: result,
  });
});

/**
 * Delete job by ID
 * DELETE /api/v1/jobs/:id
 */
const deleteJob = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params;
  const jobId = Array.isArray(id) ? id[0] : id;

  if (!userId) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: 'User not authenticated',
    });
  }

  const result = await JobService.deleteJob(jobId, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

/**
 * Get current user's jobs
 * GET /api/v1/jobs/my-jobs
 */
const getMyJobs = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: 'User not authenticated',
    });
  }

  const result = await JobService.getJobsByUserId(userId, req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Your jobs retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

const JobController = {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  getMyJobs,
};

export default JobController;
