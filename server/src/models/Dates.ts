// src/models/Dates.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IDates extends Document {
  line_item_id: string;
  srm_date?: Date;
  rd_date?: Date;
  ibd_date?: Date;
  wh_date?: Date;
  rb_date?: Date;
  is_date?: Date;
  rpu_date?: Date;
  current_status?: number; // Added field
  is_archive?: boolean; // Archive flag
}

const DatesSchema: Schema = new Schema<IDates>(
  {
    line_item_id: { type: String, required: true, ref: "LineItem" },
    srm_date: { type: Date, default: null },
    rd_date: { type: Date, default: null },
    ibd_date: { type: Date, default: null },
    wh_date: { type: Date, default: null },
    rb_date: { type: Date, default: null },
    is_date: { type: Date, default: null },
    rpu_date: { type: Date, default: null },
    current_status: { type: Number, default: null }, // Added field
    is_archive: { type: Boolean, default: false }, // Archive flag
  }
);

// Explicitly set the collection name if needed
export const Dates = mongoose.model<IDates>("Dates", DatesSchema, "dates");
