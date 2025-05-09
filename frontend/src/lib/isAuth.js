import { diag } from '@opentelemetry/api';

const isAuth = () => {
  const token = localStorage.getItem("token");
  diag.debug('Token retrieved', { token });
  return token;
};

export const userType = () => {
  const type = localStorage.getItem("type");
  diag.debug('User type retrieved', { type });
  return type;
};

export default isAuth;