import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

// Set up OpenTelemetry diagnostics
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ALL);

export const server = "http://localhost:4444";
diag.info(`Server URL set to: ${server}`);

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

diag.info(`API List: ${JSON.stringify(apiList)}`);

export default apiList;