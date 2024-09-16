```javascript
const isAuth = () => {
  console.log("Checking if user is authenticated");
  return localStorage.getItem("token");
};

export const userType = () => {
  console.log("Getting user type");
  return localStorage.getItem("type");
};

export default isAuth;
```