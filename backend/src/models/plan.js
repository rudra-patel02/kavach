import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
  {
    planId: {
      type: String,
      required: true,
      unique: true,
      enum: ["starter", "professional", "enterprise"],
      index: true,
    },
    name: {
      type: String,
      required: true,
      enum: ["Starter", "Professional", "Enterprise"],
    },
    monthlyPrice: {
      type: Number,
      default: 0,
    },
    annualPrice: {
      type: Number,
      default: 0,
    },
    userLimit: {
      type: Number,
      default: 10,
    },
    machineLimit: {
      type: Number,
      default: 25,
    },
    plantLimit: {
      type: Number,
      default: 1,
    },
    features: {
      type: [String],
      default: [],
    },
    supportLevel: {
      type: String,
      enum: ["standard", "priority", "dedicated"],
      default: "standard",
    },
    status: {
      type: String,
      enum: ["active", "retired"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Plan", planSchema);
