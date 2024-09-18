// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { trace, context } from '@opentelemetry/api';

const tracer = trace.getTracer('default');

const span = tracer.startSpan('import-jest-dom');
context.with(trace.setSpan(context.active(), span), () => {
  span.addEvent('jest-dom imported');
  console.log('Span for jest-dom import ended');
  span.end();
  console.log('Span ended for import-jest-dom');
});
