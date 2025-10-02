"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/serviceRequestRoute.ts
const express_1 = require("express");
const serviceRequestController_1 = require("../controllers/serviceRequestController");
const router = (0, express_1.Router)();
router.post("/", serviceRequestController_1.createServiceRequest);
exports.default = router;
