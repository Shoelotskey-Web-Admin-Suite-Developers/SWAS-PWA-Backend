"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAppointmentStatus = exports.cancelAffectedAppointmentsController = exports.getPendingAppointments = exports.getApprovedAppointments = void 0;
const Appointments_1 = require("../models/Appointments");
const appointmentsService_1 = require("../controllers/appointmentsService");
const pushNotifications_1 = require("../utils/pushNotifications");
// Get all approved appointments
const getApprovedAppointments = async (req, res) => {
    try {
        const approvedAppointments = await Appointments_1.Appointment.find({
            status: "Approved",
        }).sort({ date_for_inquiry: 1, time_start: 1 });
        return res.status(200).json({ success: true, data: approvedAppointments });
    }
    catch (error) {
        console.error("Error fetching approved appointments:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
exports.getApprovedAppointments = getApprovedAppointments;
// Get all pending appointments
const getPendingAppointments = async (req, res) => {
    try {
        const pendingAppointments = await Appointments_1.Appointment.find({
            status: "Pending",
        }).sort({ date_for_inquiry: 1, time_start: 1 });
        return res.status(200).json({ success: true, data: pendingAppointments });
    }
    catch (error) {
        console.error("Error fetching pending appointments:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
exports.getPendingAppointments = getPendingAppointments;
// Controller wrapper for cancelling affected appointments
const cancelAffectedAppointmentsController = async (req, res) => {
    try {
        const unavailability = req.body; // expect JSON with date_unavailable, type, time_start?, time_end?
        await (0, appointmentsService_1.cancelAffectedAppointments)(unavailability);
        return res.status(200).json({
            success: true,
            message: `Cancelled appointments affected by unavailability on ${unavailability.date_unavailable}`,
        });
    }
    catch (error) {
        console.error("Error cancelling affected appointments:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
exports.cancelAffectedAppointmentsController = cancelAffectedAppointmentsController;
// Update appointment status (approve/cancel) with push notification
const updateAppointmentStatus = async (req, res) => {
    try {
        const { appointment_id } = req.params;
        const { status } = req.body;
        if (!appointment_id) {
            return res.status(400).json({ success: false, message: "appointment_id is required" });
        }
        if (!status || !["Pending", "Cancelled", "Approved"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid or missing status" });
        }
        const updated = await Appointments_1.Appointment.findOneAndUpdate({ appointment_id }, { $set: { status } }, { new: true });
        if (!updated) {
            return res.status(404).json({ success: false, message: "Appointment not found" });
        }
        // Send push notification to customer after successful status update
        if (updated.cust_id && updated.date_for_inquiry) {
            try {
                const appointmentDate = new Date(updated.date_for_inquiry).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                let notificationTitle = '';
                let notificationBody = '';
                if (status === 'Approved') {
                    notificationTitle = 'Appointment Acknowledged';
                    notificationBody = `Your appointment on ${appointmentDate} has been acknowledged.`;
                }
                else if (status === 'Cancelled') {
                    notificationTitle = 'Appointment Cancelled';
                    notificationBody = `Your appointment on ${appointmentDate} has been cancelled.`;
                }
                if (notificationTitle && notificationBody) {
                    const notificationData = {
                        appointmentId: updated.appointment_id,
                        status: status,
                        date: updated.date_for_inquiry,
                        timeStart: updated.time_start,
                        timeEnd: updated.time_end
                    };
                    // Send push notification (non-blocking)
                    const pushResult = await (0, pushNotifications_1.sendPushNotification)(updated.cust_id, notificationTitle, notificationBody, notificationData);
                    if (!pushResult.success) {
                        // Log push notification failure but don't fail the request
                        console.warn(`Push notification failed for appointment ${appointment_id}:`, pushResult.error);
                    }
                    else {
                        console.log(`Push notification sent successfully for appointment ${appointment_id}`);
                    }
                }
            }
            catch (notificationError) {
                // Log notification error but don't fail the appointment status update
                console.error(`Failed to send push notification for appointment ${appointment_id}:`, notificationError);
            }
        }
        return res.status(200).json({
            success: true,
            data: updated,
            message: `Appointment ${status.toLowerCase()} successfully${updated.cust_id ? ' and customer notified' : ''}`
        });
    }
    catch (error) {
        console.error("Error updating appointment status:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
exports.updateAppointmentStatus = updateAppointmentStatus;
