import '@testing-library/jest-dom';
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('default');

const span = tracer.startSpan('import_jest_dom');
span.addEvent('jest-dom imported');
span.end();