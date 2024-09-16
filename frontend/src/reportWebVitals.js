const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');

// Initialize the logger
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

const reportWebVitals = onPerfEntry => {
  diag.debug('reportWebVitals called', { onPerfEntry });

  if (onPerfEntry && onPerfEntry instanceof Function) {
    diag.debug('onPerfEntry is a function', { onPerfEntry });

    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      diag.debug('web-vitals imported', { getCLS, getFID, getFCP, getLCP, getTTFB });

      getCLS(onPerfEntry);
      diag.debug('getCLS called', { onPerfEntry });

      getFID(onPerfEntry);
      diag.debug('getFID called', { onPerfEntry });

      getFCP(onPerfEntry);
      diag.debug('getFCP called', { onPerfEntry });

      getLCP(onPerfEntry);
      diag.debug('getLCP called', { onPerfEntry });

      getTTFB(onPerfEntry);
      diag.debug('getTTFB called', { onPerfEntry });
    });
  }
};

export default reportWebVitals;