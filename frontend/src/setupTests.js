import '@testing-library/jest-dom';
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('default');

tracer.startActiveSpan('import-jest-dom', span => {
  try {
    // jest-dom adds custom jest matchers for asserting on DOM nodes.
    // allows you to do things like:
    // expect(element).toHaveTextContent(/react/i)
    // learn more: https://github.com/testing-library/jest-dom
    span.addEvent('jest-dom imported successfully');
  } catch (error) {
    span.recordException(error);
    span.setStatus({ code: trace.SpanStatusCode.ERROR, message: error.message });
  } finally {
    span.end();
  }
});
