// src/models/Forecast.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IForecast extends Document {
  date: Date; // YYYY-MM-DD stored as Date
  week_start?: Date; // optional: when forecast represents weekly values
  total: number;
  branches: Map<string, number>; // dynamic branch revenue values
}

const ForecastSchema: Schema = new Schema<IForecast>(
  {
  date: { type: Date, required: true, unique: true },
  week_start: { type: Date, required: false },
    total: { type: Number, required: true },
    // dynamic keys like "SMGRA-B-NCR", "SMBAL-B-NCR", "SMVAL-B-NCR"
    branches: {
      type: Map,
      of: Number,
      required: true,
    },
  },
  {
    strict: false, // allow any extra fields like branch codes
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export const Forecast = mongoose.model<IForecast>(
  "Forecast",
  ForecastSchema,
  "forecast" // collection name
);
