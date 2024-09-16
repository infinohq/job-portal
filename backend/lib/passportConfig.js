```javascript
const { MeterProvider } = require('@opentelemetry/metrics');
const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus');

const meter = new MeterProvider({
  exporter: new PrometheusExporter({
    startServer: true,
  }),
  interval: 1000,
}).getMeter('business_metrics');

const requestCounter = meter.createCounter('requests_total', {
  description: 'Total number of requests',
});

const errorCounter = meter.createCounter('errors_total', {
  description: 'Total number of errors',
});

// Route 1
app.get('/route1', (req, res) => {
  requestCounter.add(1);
  try {
    // Route logic here
    res.send('Route 1');
  } catch (error) {
    errorCounter.add(1);
    res.status(500).send('Error in Route 1');
  }
});

// Route 2
app.get('/route2', (req, res) => {
  requestCounter.add(1);
  try {
    // Route logic here
    res.send('Route 2');
  } catch (error) {
    errorCounter.add(1);
    res.status(500).send('Error in Route 2');
  }
});
```