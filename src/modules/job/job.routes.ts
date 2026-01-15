import express from 'express';
import validateRequest from '@/middlewares/validate-request';
import {
  createJobSchema,
  updateJobSchema,
  getJobByIdSchema,
  deleteJobSchema,
  getJobsSchema,
} from './job.validation';
import JobController from './job.controller';
import authenticate from '@/middlewares/auth';
import { UserRole } from '../../../prisma/generated/prisma/enums';
import CandidateController from '../candidate/candidate.controller';
import { upload } from '@/utils/handle-cloudflare-r2-file';

const router = express.Router();

router.get(
  '/',
  authenticate(UserRole.SUPER_ADMIN),
  validateRequest(getJobsSchema),
  JobController.getJobs,
);

router.get(
  '/my-jobs',
  authenticate(UserRole.SUBSCRIBER),
  validateRequest(getJobsSchema),
  JobController.getMyJobs,
);

router.post(
  '/:id/candidates/upload-resumes',
  authenticate(UserRole.SUBSCRIBER),
  // validateRequest(uploadResumesSchema),
  upload?.array('resumes'),
  CandidateController.uploadResumes,
);

router.post(
  '/',
  authenticate(UserRole.SUBSCRIBER),
  validateRequest(createJobSchema),
  JobController.createJob,
);

router.get(
  '/:id',
  authenticate(UserRole.SUBSCRIBER, UserRole.SUPER_ADMIN),
  validateRequest(getJobByIdSchema),
  JobController.getJobById,
);

router.patch(
  '/:id',
  authenticate(UserRole.SUBSCRIBER, UserRole.SUPER_ADMIN),
  validateRequest(updateJobSchema),
  JobController.updateJob,
);

router.delete(
  '/:id',
  authenticate(UserRole.SUBSCRIBER, UserRole.SUPER_ADMIN),
  validateRequest(deleteJobSchema),
  JobController.deleteJob,
);

export const JobRoutes = router;
