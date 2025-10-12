// src/models/WeeklyRevenue.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IWeeklyRevenue extends Document {
  week_start: Date; // YYYY-MM-DD stored as Date (start of week)
  total: number;
  branches: Map<string, number>;
}

const WeeklyRevenueSchema: Schema = new Schema<IWeeklyRevenue>(
  {
    week_start: { type: Date, required: true, unique: true },
    total: { type: Number, required: true },
    branches: {
      type: Map,
      of: Number,
      required: true,
    },
  },
  {
    strict: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export const WeeklyRevenue = mongoose.model<IWeeklyRevenue>(
  "WeeklyRevenue",
  WeeklyRevenueSchema,
  "weekly_revenue"
);
