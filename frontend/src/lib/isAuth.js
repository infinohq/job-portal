import { diag } from '@opentelemetry/api';

const isAuth = () => {
  const token = localStorage.getItem("token");
  diag.debug('Retrieved token from localStorage', { token });
  return token;
};

export const userType = () => {
  const type = localStorage.getItem("type");
  diag.debug('Retrieved user type from localStorage', { type });
  return type;
};

export default isAuth;
