import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

// Set up OpenTelemetry logging
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ALL);

diag.info('Rendering the React application');

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

diag.info('React application rendered');

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

diag.info('Web vitals reporting initialized');