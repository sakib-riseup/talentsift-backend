const uploadResumes = async (resumes: Express.Multer.File[]) => {
  const files = resumes as Express.Multer.File[];

  console.log('files', files);
};

const CandidateService = {};

export default CandidateService;
