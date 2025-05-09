import { diag } from '@opentelemetry/api';
import { MeterProvider } from '@opentelemetry/sdk-metrics-base';

const meterProvider = new MeterProvider();
const meter = meterProvider.getMeter('business-metrics');

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

export default apiList;

// Example of how to increment the counters in the routes (assuming Express.js or similar framework)
// app.post('/auth/login', (req, res) => {
//   loginCounter.add(1);
//   // handle login
// });

// app.post('/auth/signup', (req, res) => {
//   signupCounter.add(1);
//   // handle signup
// });

// app.post('/upload/resume', (req, res) => {
//   resumeUploadCounter.add(1);
//   // handle resume upload
// });

// app.post('/upload/profile', (req, res) => {
//   profileImageUploadCounter.add(1);
//   // handle profile image upload
// });
