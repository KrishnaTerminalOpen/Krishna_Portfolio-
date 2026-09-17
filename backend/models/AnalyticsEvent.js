const mongoose = require("mongoose");

const analyticsEventSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      required: true,
    },

    page: {
      type: String,
      default: "portfolio",
    },

    metadata: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "AnalyticsEvent",
  analyticsEventSchema
);