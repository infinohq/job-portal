import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { diag } from '@opentelemetry/api';

diag.info('Rendering the React application');
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

diag.info('Calling reportWebVitals function');
reportWebVitals();
