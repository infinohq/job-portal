```javascript
console.log("Initializing API list...");
``` 

```javascript
export const server = "http://localhost:4444";
console.log("Server URL set to: " + server);
```

```javascript
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
console.log("API list initialized successfully.");
```

```javascript
export default apiList;
console.log("API list exported.");
```