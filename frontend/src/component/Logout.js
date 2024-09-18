import { useEffect, useContext } from "react";
import { Redirect } from "react-router-dom";
import { diag } from '@opentelemetry/api';

import { SetPopupContext } from "../App";

const Logout = (props) => {
  const setPopup = useContext(SetPopupContext);
  useEffect(() => {
    diag.info('Removing token from localStorage');
    localStorage.removeItem("token");
    diag.info('Removing type from localStorage');
    localStorage.removeItem("type");
    diag.info('Setting popup with success message');
    setPopup({
      open: true,
      severity: "success",
      message: "Logged out successfully",
    });
  }, []);
  diag.info('Redirecting to login page');
  return <Redirect to="/login" />;
};

export default Logout;
