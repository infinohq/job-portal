import { diag } from '@opentelemetry/api';

export const server = "http://localhost:4444";
diag.debug(`Server URL: ${server}`);

const apiList = {
  login: `${server}/auth/login`,
  signup: `${server}/auth/signup`,
  uploadResume: `${server}/upload/resume`,
  uploadProfileImage: `${server}/upload/profile`,
  jobs: `${server}/api/jobs`,
  applications: `${server}/api/applications`,
  rating: `${server}/api/rating`,
  user: `${server}/api/user`,
  applicants: `${server}/api/applicants`,
};

diag.debug(`API List: ${JSON.stringify(apiList)}`);

export default apiList;
