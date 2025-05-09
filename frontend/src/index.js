import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

// Set up OpenTelemetry diagnostics logger
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ALL);

diag.info('Starting ReactDOM.render');
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