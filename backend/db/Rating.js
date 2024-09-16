```javascript
const { MeterProvider } = require('@opentelemetry/metrics');
const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus');

const meter = new MeterProvider({
  exporter: new PrometheusExporter({
    startServer: true,
  }),
  interval: 1000,
}).getMeter('business_metrics');

const requestsCounter = meter.createCounter('ratings_requests', {
  description: 'Number of requests to the ratings endpoint',
});

const errorsCounter = meter.createCounter('ratings_errors', {
  description: 'Number of errors from the ratings endpoint',
});

console.log("Adding log messages for better traceability");
const mongoose = require("mongoose");

let schema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ["job", "applicant"],
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    rating: {
      type: Number,
      max: 5.0,
      default: -1.0,
      validate: {
        validator: function (v) {
          return v >= -1.0 && v <= 5.0;
        },
        msg: "Invalid rating",
      },
    },
  },
  { collation: { locale: "en" } }
);

schema.index({ category: 1, receiverId: 1, senderId: 1 }, { unique: true });

module.exports = mongoose.model("ratings", schema);
```