import { diag } from '@opentelemetry/api';

const reportWebVitals = onPerfEntry => {
  diag.debug('reportWebVitals function called with onPerfEntry:', onPerfEntry);
  if (onPerfEntry && onPerfEntry instanceof Function) {
    diag.debug('onPerfEntry is a function, proceeding to import web-vitals');
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      diag.debug('web-vitals module imported successfully');
      diag.debug('Calling getCLS with onPerfEntry');
      getCLS(onPerfEntry);
      diag.debug('Calling getFID with onPerfEntry');
      getFID(onPerfEntry);
      diag.debug('Calling getFCP with onPerfEntry');
      getFCP(onPerfEntry);
      diag.debug('Calling getLCP with onPerfEntry');
      getLCP(onPerfEntry);
      diag.debug('Calling getTTFB with onPerfEntry');
      getTTFB(onPerfEntry);
    }).catch(error => {
      diag.error('Error importing web-vitals module:', error);
    });
  } else {
    diag.debug('onPerfEntry is not a function, skipping web-vitals import');
  }
};

export default reportWebVitals;