import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { MeterProvider } from '@opentelemetry/sdk-metrics-base';
import { ConsoleMetricExporter } from '@opentelemetry/sdk-metrics-base';

// Set up OpenTelemetry diagnostics logger
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ALL);

const meterProvider = new MeterProvider({
  exporter: new ConsoleMetricExporter(),
  interval: 1000,
});

const meter = meterProvider.getMeter('business-metrics');

const renderCounter = meter.createCounter('app.render.count', {
  description: 'Counts the number of times the app is rendered',
});

const userInteractionCounter = meter.createCounter('app.user.interaction.count', {
  description: 'Counts the number of user interactions',
});

const errorCounter = meter.createCounter('app.error.count', {
  description: 'Counts the number of errors encountered in the app',
});

const pageLoadTime = meter.createValueRecorder('app.page.load.time', {
  description: 'Records the page load time',
});

diag.info('Starting ReactDOM.render');
renderCounter.add(1);
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
diag.info('ReactDOM.render completed');

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
diag.info('Initializing reportWebVitals');
reportWebVitals();
diag.info('reportWebVitals initialized');
