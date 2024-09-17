// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { trace, context, metrics } from '@opentelemetry/api';

const tracer = trace.getTracer('default');
const meter = metrics.getMeter('default');

const span = tracer.startSpan('import-jest-dom');
context.with(trace.setSpan(context.active(), span), () => {
  span.addEvent('jest-dom imported');
  span.end();
});

const requestCounter = meter.createCounter('requests', {
  description: 'Count all incoming requests',
});

const errorCounter = meter.createCounter('errors', {
  description: 'Count all errors',
});

const responseTimeHistogram = meter.createHistogram('response_time', {
  description: 'Measure response times',
});

const activeRequestsGauge = meter.createUpDownCounter('active_requests', {
  description: 'Track active requests',
});

const express = require('express');
const app = express();

app.use((req, res, next) => {
  const requestSpan = tracer.startSpan('http_request', {
    attributes: { 'http.method': req.method, 'http.url': req.url },
  });
  context.with(trace.setSpan(context.active(), requestSpan), () => {
    requestCounter.add(1, { method: req.method, route: req.url });
    activeRequestsGauge.add(1);

    res.on('finish', () => {
      requestSpan.setAttribute('http.status_code', res.statusCode);
      requestSpan.end();
      activeRequestsGauge.add(-1);
      responseTimeHistogram.record(Date.now() - req.startTime, {
        method: req.method,
        route: req.url,
        status_code: res.statusCode,
      });
    });

    res.on('error', () => {
      errorCounter.add(1, { method: req.method, route: req.url });
    });

    next();
  });
});

app.get('/', (req, res) => {
  req.startTime = Date.now();
  res.send('Hello World!');
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
