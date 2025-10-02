// src/models/Appointment.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IAppointment extends Document {
  appointment_id: string; // e.g., APPT-001
  cust_id: string; // FK -> Customer
  branch_id: string; // FK -> Branch
  date_for_inquiry: Date;
  time_start: string; // HH:mm
  time_end: string;   // HH:mm
  status: "Pending" | "Cancelled" | "Approved";
}

const AppointmentSchema: Schema = new Schema<IAppointment>(
  {
    appointment_id: { type: String, required: true, unique: true }, // e.g., APPT-001
    cust_id: { type: String, required: true, ref: "Customer" },
    branch_id: { type: String, required: true, ref: "Branch" },
    date_for_inquiry: { type: Date, required: true },
    time_start: { type: String, required: true }, // store as "HH:mm"
    time_end: { type: String, required: true },   // store as "HH:mm"
    status: {
      type: String,
      enum: ["Pending", "Cancelled", "Approved"],
      default: "Pending",
      required: true,
    },
  }
);

export const Appointment = mongoose.model<IAppointment>(
  "Appointment",
  AppointmentSchema,
  "appointments"
);
