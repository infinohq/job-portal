import { trace, metrics } from '@opentelemetry/api';

const tracer = trace.getTracer('default');
const meter = metrics.getMeter('default');

const authAttemptsCounter = meter.createCounter('auth_attempts', {
  description: 'Count of authentication attempts',
});

const userTypeRetrievalCounter = meter.createCounter('user_type_retrievals', {
  description: 'Count of user type retrievals',
});

const isAuth = () => {
  const span = tracer.startSpan('isAuth');
  const token = localStorage.getItem("token");
  span.addEvent('Retrieved token from localStorage', { token });
  authAttemptsCounter.add(1);
  span.end();
  return token;
};

export const userType = () => {
  const span = tracer.startSpan('userType');
  const type = localStorage.getItem("type");
  span.addEvent('Retrieved type from localStorage', { type });
  userTypeRetrievalCounter.add(1);
  span.end();
  return type;
};

export default isAuth;
