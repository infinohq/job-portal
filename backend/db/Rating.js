const mongoose = require("mongoose");
console.log("Mongoose library required");

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
console.log("Schema created");

schema.index({ category: 1, receiverId: 1, senderId: 1 }, { unique: true });
console.log("Index created for category, receiverId, and senderId");

module.exports = mongoose.model("ratings", schema);
console.log("Model exported");