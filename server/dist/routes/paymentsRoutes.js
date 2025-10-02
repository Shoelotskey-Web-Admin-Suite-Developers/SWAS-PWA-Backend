"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const paymentsController_1 = require("../controllers/paymentsController");
const router = (0, express_1.Router)();
router.get("/:payment_id", paymentsController_1.getPaymentById);
router.get("/latest/transaction/:transaction_id", paymentsController_1.getLatestPaymentByTransactionId);
router.post("/", paymentsController_1.createPayment);
exports.default = router;
