import '@testing-library/jest-dom';
import { trace, context, metrics } from '@opentelemetry/api';

const tracer = trace.getTracer('default');
const meter = metrics.getMeter('default');

const span = tracer.startSpan('import-jest-dom');
context.with(trace.setSpan(context.active(), span), () => {
  span.addEvent('jest-dom imported');
  span.end();
});

const jestDomImportCounter = meter.createCounter('jest_dom_import_count', {
  description: 'Counts the number of times jest-dom is imported',
});

jestDomImportCounter.add(1);
