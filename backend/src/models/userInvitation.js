import mongoose from "mongoose";

const userInvitationSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      default: "",
      index: true,
    },
    organizationId: {
      type: String,
      default: "",
      index: true,
    },
    plantIds: {
      type: [String],
      default: [],
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      default: "",
      trim: true,
    },
    role: {
      type: String,
      required: true,
      default: "Viewer",
      index: true,
    },
    permissions: {
      type: [String],
      default: [],
    },
    invitedBy: {
      type: String,
      default: "",
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Revoked", "Expired"],
      default: "Pending",
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    acceptedAt: Date,
    revokedAt: Date,
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

userInvitationSchema.index({ tenantId: 1, organizationId: 1, status: 1 });
userInvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("UserInvitation", userInvitationSchema);
