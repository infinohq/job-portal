const { diag } = require('@opentelemetry/api');

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
    });
  } else {
    diag.debug('onPerfEntry is not a function or is undefined');
  }
};

export default reportWebVitals;
