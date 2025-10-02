"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const appointmentsController_1 = require("../controllers/appointmentsController");
const router = express_1.default.Router();
router.get("/approved", appointmentsController_1.getApprovedAppointments);
router.get("/pending", appointmentsController_1.getPendingAppointments);
// Use the controller wrapper for cancelling affected appointments
router.post("/cancel-affected", appointmentsController_1.cancelAffectedAppointmentsController);
// Update single appointment status by appointment_id
router.put("/:appointment_id/status", appointmentsController_1.updateAppointmentStatus);
exports.default = router;
