"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/transactionRoutes.ts
const express_1 = require("express");
const transactionController_1 = require("../controllers/transactionController");
const router = (0, express_1.Router)();
router.get("/:transaction_id", transactionController_1.getTransactionById);
router.post("/:transaction_id/apply-payment", transactionController_1.applyPayment);
router.get("/", transactionController_1.getAllTransactions);
exports.default = router;
