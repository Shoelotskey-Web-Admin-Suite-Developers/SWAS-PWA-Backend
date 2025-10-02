"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPayment = exports.getLatestPaymentByTransactionId = exports.getPaymentById = void 0;
const payments_1 = require("../models/payments");
const getPaymentById = async (req, res) => {
    try {
        const { payment_id } = req.params;
        if (!payment_id)
            return res.status(400).json({ success: false, error: "payment_id required" });
        const payment = await payments_1.Payment.findOne({ payment_id });
        if (!payment)
            return res.status(404).json({ success: false, error: "Payment not found" });
        return res.status(200).json({ success: true, payment });
    }
    catch (err) {
        console.error("Error fetching payment by id:", err);
        return res.status(500).json({ success: false, error: "Server error" });
    }
};
exports.getPaymentById = getPaymentById;
const getLatestPaymentByTransactionId = async (req, res) => {
    try {
        const { transaction_id } = req.params;
        if (!transaction_id)
            return res.status(400).json({ success: false, error: "transaction_id required" });
        // Find latest payment for this transaction ordered by payment_date (or createdAt)
        const payment = await payments_1.Payment.findOne({ transaction_id }).sort({ payment_date: -1, createdAt: -1 }).limit(1);
        if (!payment)
            return res.status(404).json({ success: false, error: "No payments found for this transaction" });
        return res.status(200).json({ success: true, payment });
    }
    catch (err) {
        console.error("Error fetching latest payment by transaction id:", err);
        return res.status(500).json({ success: false, error: "Server error" });
    }
};
exports.getLatestPaymentByTransactionId = getLatestPaymentByTransactionId;
// Create a new payment record. Body expected: { transaction_id, payment_amount, payment_mode?, branch_id? }
const createPayment = async (req, res) => {
    try {
        const { transaction_id, payment_amount, payment_mode, branch_id } = req.body;
        if (!transaction_id)
            return res.status(400).json({ success: false, error: "transaction_id required" });
        if (payment_amount == null || isNaN(Number(payment_amount)) || Number(payment_amount) <= 0)
            return res.status(400).json({ success: false, error: "payment_amount must be a positive number" });
        // Determine branch code if branch_id provided
        let branchCode = "";
        if (branch_id) {
            try {
                const Branch = require("../models/Branch").Branch;
                const branch = await Branch.findOne({ branch_id });
                if (branch && branch.branch_code)
                    branchCode = branch.branch_code;
            }
            catch (e) {
                // ignore and fallback to empty string
            }
        }
        const { generatePaymentId } = require("../utils/generatePaymentId");
        const paymentId = await generatePaymentId(branchCode || "");
        const payment = new payments_1.Payment({
            payment_id: paymentId,
            transaction_id,
            payment_amount: Number(payment_amount),
            payment_mode: payment_mode || "Other",
            payment_date: new Date(),
        });
        await payment.save();
        return res.status(201).json({ success: true, payment });
    }
    catch (err) {
        console.error("Error creating payment:", err);
        return res.status(500).json({ success: false, error: "Server error" });
    }
};
exports.createPayment = createPayment;
