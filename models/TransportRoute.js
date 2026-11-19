
const mongoose = require("mongoose");

const pickupPointSchema = new mongoose.Schema(
  {
    pointName: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
    },
    sequence: {
      type: Number,
      required: true,
    },
  },
  { _id: true }
);

const transportRouteSchema = new mongoose.Schema(
  {
    routeName: {
      type: String,
      required: true,
      trim: true,
    },
    routeCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    startingPoint: {
      type: String,
      required: true,
    },
    endingPoint: {
      type: String,
      required: true,
    },
    pickupPoints: {
      type: [pickupPointSchema],
      default: [],
    },
    totalDistance: {
      type: Number,
      required: true,
      min: 0,
    },
    estimatedTravelTime: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "TransportRoute",
  transportRouteSchema
);
