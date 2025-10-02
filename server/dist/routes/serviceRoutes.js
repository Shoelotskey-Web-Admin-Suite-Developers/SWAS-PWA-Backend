"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/serviceRoutes.ts
const express_1 = __importDefault(require("express"));
const serviceController_1 = require("../controllers/serviceController");
const router = express_1.default.Router();
// GET all services
router.get("/", serviceController_1.getAllServices);
// POST a new service
router.post("/", serviceController_1.addService);
// GET service by id
router.get("/:serviceId", serviceController_1.getServiceById);
exports.default = router;
