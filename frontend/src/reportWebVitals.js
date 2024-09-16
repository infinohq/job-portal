```javascript
const reportWebVitals = onPerfEntry => {
  console.log('Web Vitals report started');
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      console.log('Imported web-vitals library');
      getCLS(onPerfEntry);
      console.log('CLS metric collected');
      getFID(onPerfEntry);
      console.log('FID metric collected');
      getFCP(onPerfEntry);
      console.log('FCP metric collected');
      getLCP(onPerfEntry);
      console.log('LCP metric collected');
      getTTFB(onPerfEntry);
      console.log('TTFB metric collected');
    });
  }
};

export default reportWebVitals;
```