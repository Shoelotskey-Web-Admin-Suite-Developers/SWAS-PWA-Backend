"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/// src/routes/unavailabilityRoutes.ts
const express_1 = __importDefault(require("express"));
const unavailabilityController_1 = require("../controllers/unavailabilityController");
const router = express_1.default.Router();
// Create a new unavailability
router.post("/", unavailabilityController_1.addUnavailability);
// Get all unavailability records
router.get("/", unavailabilityController_1.getAllUnavailability);
// Get a specific unavailability by unavailability_id
router.get("/:id", unavailabilityController_1.getUnavailabilityById);
// Delete a specific unavailability by unavailability_id
router.delete("/:id", unavailabilityController_1.deleteUnavailability);
exports.default = router;
