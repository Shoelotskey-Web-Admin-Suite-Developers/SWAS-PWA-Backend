
import mongoose, { Schema, Document } from "mongoose";

export interface IBranch extends Document {
  branch_id: string;
  branch_number: number;
  branch_name: string;
  location: string;
  branch_code: string;
  type: "H" | "B" | "W";
  fb_link?: string;
  gmap_link?: string;
}

const BranchSchema: Schema = new Schema<IBranch>(
  {
    branch_id: { type: String, required: true, unique: true },
    branch_number: { type: Number, required: true, unique: true },
    branch_name: { type: String, required: true, maxlength: 100 },
    location: { type: String, required: true, maxlength: 100 },
    branch_code: { type: String, required: true, unique: true, maxlength: 20 },
    type: { type: String, enum: ["H", "B", "W"], required: true },
    fb_link: { type: String, maxlength: 200 },
    gmap_link: { type: String, maxlength: 500 },
  }
);

export const Branch = mongoose.model<IBranch>(
  "Branch",
  BranchSchema,
  "branches"
);
