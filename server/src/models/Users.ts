/// src/models/Users.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  user_id: string; // NCR-VAL-B style (REG-<BRANCHCODE>-<TYPE>)
  branch_id: string; // FK -> Branch
  user_name?: string | null;
  password: string; // hashed password
  position?: string; // e.g., superadmin, admin, staff
}

const UserSchema: Schema = new Schema<IUser>(
  {
    user_id: { type: String, required: true, unique: true }, // e.g., NCR-VAL-B
    branch_id: { type: String, required: true, ref: "Branch" },
    user_name: { type: String, default: null },
    password: { type: String, required: true },
    position: { type: String },
  }
  // no timestamps
);

export const User = mongoose.model<IUser>(
  "User",
  UserSchema,
  "users"
);
