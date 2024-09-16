const { MeterProvider } = require('@opentelemetry/metrics');
const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus');

const meter = new MeterProvider({
  exporter: new PrometheusExporter({
    startServer: true,
  }),
  interval: 10000,
}).getMeter('your-meter-name');

const successfulSignupCounter = meter.createCounter("successful_signup_counter", {
  description: "Counts the number of successful user signups",
});

const failedSignupCounter = meter.createCounter("failed_signup_counter", {
  description: "Counts the number of failed user signups",
});

const successfulLoginCounter = meter.createCounter("successful_login_counter", {
  description: "Counts the number of successful user logins",
});

const failedLoginCounter = meter.createCounter("failed_login_counter", {
  description: "Counts the number of failed user logins",
});

router.post("/signup", (req, res) => {
  successfulSignupCounter.add(1);
  failedSignupCounter.add(0);
  // existing code for signup route
});

router.post("/login", (req, res, next) => {
  successfulLoginCounter.add(1);
  failedLoginCounter.add(0);
  // existing code for login route
});