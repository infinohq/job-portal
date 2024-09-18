import { useEffect, useContext } from "react";
import { Redirect } from "react-router-dom";
import { SetPopupContext } from "../App";
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('default');

const Logout = (props) => {
  const setPopup = useContext(SetPopupContext);
  useEffect(() => {
    const span = tracer.startSpan('Logout useEffect');
    try {
      localStorage.removeItem("token");
      span.addEvent('Removed token from localStorage');
      localStorage.removeItem("type");
      span.addEvent('Removed type from localStorage');
      setPopup({
        open: true,
        severity: "success",
        message: "Logged out successfully",
      });
      span.addEvent('Set popup with success message');
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: 2, message: error.message });
    } finally {
      span.end();
    }
  }, []);
  return <Redirect to="/login" />;
};

export default Logout;
