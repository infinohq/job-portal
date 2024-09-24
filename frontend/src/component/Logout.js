import { useEffect, useContext } from "react";
import { Redirect } from "react-router-dom";
import { diag } from "@opentelemetry/api"; // Import OpenTelemetry for logging

import { SetPopupContext } from "../App";

const Logout = (props) => {
  const setPopup = useContext(SetPopupContext);
  useEffect(() => {
    diag.debug("Removing token from localStorage");
    localStorage.removeItem("token");
    diag.debug("Removing type from localStorage");
    localStorage.removeItem("type");
    diag.debug("Setting popup with success message");
    setPopup({
      open: true,
      severity: "success",
      message: "Logged out successfully",
    });
  }, []);
  diag.debug("Redirecting to /login");
  return <Redirect to="/login" />;
};

export default Logout;
