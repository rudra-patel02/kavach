import mongoose from "mongoose";

const invoiceLineSchema = new mongoose.Schema(
  {
    description: String,
    quantity: {
      type: Number,
      default: 1,
    },
    unitAmount: {
      type: Number,
      default: 0,
    },
    amount: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    organizationId: {
      type: String,
      default: "",
      index: true,
    },
    subscriptionId: {
      type: String,
      default: "",
      index: true,
    },
    status: {
      type: String,
      enum: ["draft", "open", "paid", "void", "uncollectible"],
      default: "draft",
      index: true,
    },
    currency: {
      type: String,
      default: "USD",
    },
    amountDue: {
      type: Number,
      default: 0,
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    dueDate: Date,
    paidAt: Date,
    lines: {
      type: [invoiceLineSchema],
      default: [],
    },
  },
  { timestamps: true }
);

invoiceSchema.index({ tenantId: 1, status: 1, dueDate: 1 });

export default mongoose.model("Invoice", invoiceSchema);
