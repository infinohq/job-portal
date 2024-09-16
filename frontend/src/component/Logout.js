import { useEffect, useContext } from "react";
import { Redirect } from "react-router-dom";
import { diag } from '@opentelemetry/api';

import { SetPopupContext } from "../App";

const Logout = (props) => {
  const setPopup = useContext(SetPopupContext);
  useEffect(() => {
    diag.info('Removing token from localStorage', { token: localStorage.getItem("token") });
    localStorage.removeItem("token");
    diag.info('Removing type from localStorage', { type: localStorage.getItem("type") });
    localStorage.removeItem("type");
    setPopup({
      open: true,
      severity: "success",
      message: "Logged out successfully",
    });
    diag.info('Popup set with success message', { popup: { open: true, severity: "success", message: "Logged out successfully" } });
  }, []);
  return <Redirect to="/login" />;
};

export default Logout;