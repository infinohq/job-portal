import { trace } from '@opentelemetry/api';

const isAuth = () => {
  const token = localStorage.getItem("token");
  trace.getTracer('default').addEvent('Retrieved token from localStorage', { token });
  return token;
};

export const userType = () => {
  const type = localStorage.getItem("type");
  trace.getTracer('default').addEvent('Retrieved user type from localStorage', { type });
  return type;
};

export default isAuth;
