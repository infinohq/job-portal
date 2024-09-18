import '@testing-library/jest-dom';
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('default');

// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom

tracer.startActiveSpan('jest-dom-import', span => {
  try {
    // Log the successful import of jest-dom
    span.addEvent('jest-dom imported successfully');
  } catch (error) {
    // Log any error that might occur during the import
    span.recordException(error);
  } finally {
    span.end();
  }
});
