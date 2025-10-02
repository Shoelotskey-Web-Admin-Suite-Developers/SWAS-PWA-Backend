"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelAffectedAppointments = void 0;
// src/services/appointmentsService.ts
const Appointments_1 = require("../models/Appointments");
const cancelAffectedAppointments = async (unavailability) => {
    try {
        const dateStr = unavailability.date_unavailable;
        let filter = {
            status: "Approved",
            date_for_inquiry: dateStr
        };
        if (unavailability.type === "Partial Day") {
            // Partial day: filter appointments that overlap with partial hours
            filter.time_start = { $lt: unavailability.time_end };
            filter.time_end = { $gt: unavailability.time_start };
        }
        const affectedAppointments = await Appointments_1.Appointment.find(filter);
        if (affectedAppointments.length === 0)
            return; // nothing to cancel
        const affectedIds = affectedAppointments.map(a => a._id);
        await Appointments_1.Appointment.updateMany({ _id: { $in: affectedIds } }, { $set: { status: "Cancelled", cancel_reason: `Cancelled due to unavailability (${unavailability.type})` } });
        console.log(`Cancelled ${affectedAppointments.length} appointment(s) affected by unavailability on ${dateStr}`);
    }
    catch (err) {
        console.error("Error cancelling affected appointments:", err);
    }
};
exports.cancelAffectedAppointments = cancelAffectedAppointments;
