import { diag, metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('business-metrics');
const loginCounter = meter.createCounter('login_requests', {
  description: 'Count of login requests',
});
const signupCounter = meter.createCounter('signup_requests', {
  description: 'Count of signup requests',
});
const resumeUploadCounter = meter.createCounter('resume_uploads', {
  description: 'Count of resume uploads',
});
const profileImageUploadCounter = meter.createCounter('profile_image_uploads', {
  description: 'Count of profile image uploads',
});

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

// Simulate API calls for demonstration purposes
function simulateApiCall(api) {
  switch (api) {
    case apiList.login:
      loginCounter.add(1);
      break;
    case apiList.signup:
      signupCounter.add(1);
      break;
    case apiList.uploadResume:
      resumeUploadCounter.add(1);
      break;
    case apiList.uploadProfileImage:
      profileImageUploadCounter.add(1);
      break;
    default:
      break;
  }
}

// Example usage
simulateApiCall(apiList.login);
simulateApiCall(apiList.signup);
simulateApiCall(apiList.uploadResume);
simulateApiCall(apiList.uploadProfileImage);

export default apiList;
