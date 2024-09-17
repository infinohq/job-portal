import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('default');

const isAuth = () => {
  const span = tracer.startSpan('isAuth');
  const token = localStorage.getItem("token");
  span.addEvent('Retrieved token from localStorage', { token });
  span.end();
  return token;
};

export const userType = () => {
  const span = tracer.startSpan('userType');
  const type = localStorage.getItem("type");
  span.addEvent('Retrieved type from localStorage', { type });
  span.end();
  return type;
};

export default isAuth;
