import { useEffect, useContext } from "react";
import { Redirect } from "react-router-dom";
import { SetPopupContext } from "../App";
import { trace, metrics } from '@opentelemetry/api';

const tracer = trace.getTracer('default');
const meter = metrics.getMeter('default');

const logoutCounter = meter.createCounter('logout_count', {
  description: 'Count of user logouts',
});

const Logout = (props) => {
  const setPopup = useContext(SetPopupContext);
  useEffect(() => {
    const span = tracer.startSpan('Logout useEffect');
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("type");
      setPopup({
        open: true,
        severity: "success",
        message: "Logged out successfully",
      });
      span.addEvent('Removed token and type from localStorage');
      span.addEvent('Set popup with success message');
      logoutCounter.add(1);
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
