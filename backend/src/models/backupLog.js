import mongoose from "mongoose";

const backupLogSchema = new mongoose.Schema(
  {
    backupId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["export", "restore", "scheduled"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["running", "completed", "failed", "dry_run"],
      default: "running",
      index: true,
    },
    collections: {
      type: [String],
      default: [],
    },
    documentCounts: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    fileName: {
      type: String,
      default: "",
    },
    fileSizeBytes: {
      type: Number,
      default: 0,
    },
    error: {
      type: String,
      default: "",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    retentionExpiresAt: {
      type: Date,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: Date,
  },
  { timestamps: true }
);

backupLogSchema.index({ retentionExpiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("BackupLog", backupLogSchema);
