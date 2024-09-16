```jsx
import { useEffect, useContext } from "react";
import { Redirect } from "react-router-dom";

import { SetPopupContext } from "../App";

const Logout = (props) => {
  const setPopup = useContext(SetPopupContext);
  useEffect(() => {
    console.log("Removing token and type from localStorage");
    localStorage.removeItem("token");
    localStorage.removeItem("type");
    setPopup({
      open: true,
      severity: "success",
      message: "Logged out successfully",
    });
    console.log("Logged out successfully");
  }, []);
  console.log("Redirecting to /login");
  return <Redirect to="/login" />;
};

export default Logout;
```