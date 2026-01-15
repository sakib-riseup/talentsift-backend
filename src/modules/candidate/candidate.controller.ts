import { Request, Response } from 'express';
import sendResponse from '@/utils/send-response';
import httpStatus from 'http-status';
import AppError from '@/errors/app-error';
import CandidateUtils from './candidate.utils';

const uploadResumes = async (req: Request, res: Response) => {
  // Safely get files from request
  const files = req?.files;

  // Check if files exists and is an array
  if (!files || !Array.isArray(files) || files.length === 0) {
    throw new AppError(httpStatus.BAD_REQUEST, 'No files uploaded');
  }

  // Extract buffers from files with proper null checking
  const buffers = files
    .map((file) => file?.buffer)
    .filter(
      (buffer): buffer is Buffer => buffer !== null && buffer !== undefined,
    );

  if (buffers.length === 0) {
    throw new AppError(httpStatus.BAD_REQUEST, 'No valid file buffers found');
  }

  const extractedTexts = await CandidateUtils.extractTextFromPDFs(
    buffers as Buffer[],
  );

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Resumes uploaded successfully',
    data: {
      extractedTexts,
    },
  });
};

const CandidateController = {
  uploadResumes,
};

export default CandidateController;
