import express from "express";
import {
  getApprovedAppointments,
  getPendingAppointments,
  cancelAffectedAppointmentsController,
  updateAppointmentStatus,
  updateAppointmentAttendance,
} from "../controllers/appointmentsController";

const router = express.Router();

router.get("/approved", getApprovedAppointments);
router.get("/pending", getPendingAppointments);

// Use the controller wrapper for cancelling affected appointments
router.post("/cancel-affected", cancelAffectedAppointmentsController);

// Update single appointment status by appointment_id
router.put("/:appointment_id/status", updateAppointmentStatus);

// Update appointment attendance status (verify arrival or flag as missed)
router.put("/attendance", updateAppointmentAttendance);

export default router;
