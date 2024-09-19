import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('default');

const isAuth = () => {
  const token = localStorage.getItem("token");
  tracer.startSpan('isAuth').addEvent('Retrieved token from localStorage', { token });
  return token;
};

export const userType = () => {
  const type = localStorage.getItem("type");
  tracer.startSpan('userType').addEvent('Retrieved user type from localStorage', { type });
  return type;
};

export default isAuth;
