"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServiceRequest = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Customer_1 = require("../models/Customer");
const LineItem_1 = require("../models/LineItem");
const Transactions_1 = require("../models/Transactions");
const payments_1 = require("../models/payments");
const generatePaymentId_1 = require("../utils/generatePaymentId");
const Branch_1 = require("../models/Branch");
const Service_1 = require("../models/Service");
// Allowed enums
const PRIORITY_ENUM = ["Rush", "Normal"];
const CURRENT_LOCATION_ENUM = ["Hub", "Branch"];
const PAYMENT_STATUS_ENUM = ["NP", "PARTIAL", "PAID"];
const PAYMENT_MODE_ENUM = ["Cash", "Bank", "GCash", "Other"];
// ------------------- ID generators -------------------
const generateCustomerId = async (branch_number) => {
    const lastCust = await Customer_1.Customer.find({ cust_id: new RegExp(`CUST-${branch_number}-`) })
        .sort({ cust_id: -1 })
        .limit(1);
    const lastNumber = lastCust[0] ? parseInt(lastCust[0].cust_id.split("-")[2], 10) : 0;
    // Use plain incremented number without zero-padding for the customer id suffix
    return `CUST-${branch_number}-${lastNumber + 1}`;
};
const generateTransactionId = async (branch_code) => {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    // match existing transactions with the same yearMonth and branch_code at the end
    const lastTrx = await Transactions_1.Transaction.find({ transaction_id: new RegExp(`^${yearMonth}-\\d{5}-${branch_code}$`) })
        .sort({ transaction_id: -1 })
        .limit(1);
    const lastNumber = lastTrx[0] ? parseInt(lastTrx[0].transaction_id.split("-")[2], 10) : 0;
    // Keep full branch_code as provided (it may contain hyphens)
    return `${yearMonth}-${String(lastNumber + 1).padStart(5, "0")}-${branch_code}`;
};
// use centralized generatePaymentId from utils
// Generate line item id that includes the transaction prefix (yearMonth and transaction increment)
// Desired format: <YYYY-MM>-<trxIncrement>-<lineIncrement>-<branch_code>
const generateLineItemId = (transactionId, lineIndex) => {
    // transactionId assumed format: <YYYY-MM>-<trxIncrement>-<branch_code>
    const parts = transactionId.split("-");
    const year = parts[0];
    const month = parts[1];
    const trxIncrement = parts[2];
    // branch code may contain hyphens; everything after the third dash is branch code
    const branchCode = parts.slice(3).join("-");
    return `${year}-${month}-${trxIncrement}-${String(lineIndex + 1).padStart(3, "0")}-${branchCode}`;
};
// ------------------- Validation -------------------
const validateServiceRequestInput = (data) => {
    const errors = [];
    if (!data.cust_name)
        errors.push("cust_name is required");
    if (!data.branch_id)
        errors.push("branch_id is required");
    if (!data.received_by)
        errors.push("received_by is required");
    if (data.total_amount == null)
        errors.push("total_amount is required");
    if (data.discount_amount == null)
        errors.push("discount_amount is required");
    if (data.amount_paid == null)
        errors.push("amount_paid is required");
    if (!PAYMENT_STATUS_ENUM.includes(data.payment_status))
        errors.push(`payment_status must be one of ${PAYMENT_STATUS_ENUM.join(", ")}`);
    if (!PAYMENT_MODE_ENUM.includes(data.payment_mode))
        errors.push(`payment_mode must be one of ${PAYMENT_MODE_ENUM.join(", ")}`);
    if (!Array.isArray(data.lineItems) || data.lineItems.length === 0) {
        errors.push("At least one line item is required");
    }
    else {
        data.lineItems.forEach((item, index) => {
            if (!PRIORITY_ENUM.includes(item.priority))
                errors.push(`lineItems[${index}].priority must be one of ${PRIORITY_ENUM.join(", ")}`);
            if (!item.shoes)
                errors.push(`lineItems[${index}].shoes is required`);
            if (!Array.isArray(item.services) || item.services.length === 0) {
                errors.push(`lineItems[${index}].services is required and cannot be empty`);
            }
            else {
                item.services.forEach((svc, svcIndex) => {
                    if (!svc.service_id || typeof svc.service_id !== "string")
                        errors.push(`lineItems[${index}].services[${svcIndex}].service_id is required`);
                    if (svc.quantity == null || typeof svc.quantity !== "number" || svc.quantity < 1)
                        errors.push(`lineItems[${index}].services[${svcIndex}].quantity must be a number >= 1`);
                });
            }
            if (item.current_location && !CURRENT_LOCATION_ENUM.includes(item.current_location))
                errors.push(`lineItems[${index}].current_location must be one of ${CURRENT_LOCATION_ENUM.join(", ")}`);
        });
    }
    return errors;
};
// ------------------- Controller -------------------
const createServiceRequest = async (req, res) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const data = req.body;
        // Validate input shape
        const validationErrors = validateServiceRequestInput(data);
        if (validationErrors.length > 0) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, errors: validationErrors });
        }
        // Fetch branch
        const branch = await Branch_1.Branch.findOne({ branch_id: data.branch_id }).session(session);
        if (!branch) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, errors: ["Branch not found"] });
        }
        const branch_number = branch.branch_number;
        const branch_code = branch.branch_code;
        // Collect all service ids for existence check
        const allServiceIds = data.lineItems.flatMap((li) => li.services.map((s) => s.service_id));
        const uniqueServiceIds = [...new Set(allServiceIds)];
        const existingServices = await Service_1.Service.find({ service_id: { $in: uniqueServiceIds } }).session(session);
        const existingIds = existingServices.map((s) => s.service_id);
        const invalidIds = uniqueServiceIds.filter((id) => !existingIds.includes(id));
        if (invalidIds.length > 0) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, errors: [`Invalid service_id(s): ${invalidIds.join(", ")}`] });
        }
        // Check or create customer
        let customer = await Customer_1.Customer.findOne({
            cust_name: data.cust_name,
            cust_bdate: data.cust_bdate || null,
        }).session(session);
        if (!customer) {
            const cust_id = await generateCustomerId(branch_number);
            customer = new Customer_1.Customer({
                cust_id,
                cust_name: data.cust_name,
                cust_bdate: data.cust_bdate || null,
                cust_address: data.cust_address || null,
                cust_email: data.cust_email || null,
                cust_contact: data.cust_contact || null,
                total_services: 0,
                total_expenditure: 0,
            });
            await customer.save({ session });
        }
        // Generate transaction ID
        const transactionId = await generateTransactionId(branch_code);
        // Create Line Items
        const createdLineItems = [];
        for (let i = 0; i < data.lineItems.length; i++) {
            const item = data.lineItems[i];
            const lineItemId = generateLineItemId(transactionId, i);
            // Parse/normalize due_date if provided
            const dueDateValue = item.due_date != null && item.due_date !== ""
                ? new Date(item.due_date)
                : null;
            // Convert services to the DB subdocument shape (just ensure correct typing)
            const servicesForDb = item.services.map((s) => ({
                service_id: s.service_id,
                quantity: s.quantity,
            }));
            const newLineItem = new LineItem_1.LineItem({
                line_item_id: lineItemId,
                transaction_id: transactionId,
                priority: item.priority,
                cust_id: customer.cust_id,
                services: servicesForDb,
                storage_fee: item.storage_fee || 0,
                branch_id: data.branch_id,
                shoes: item.shoes,
                current_location: item.current_location || "Branch",
                current_status: "Queued",
                due_date: dueDateValue,
                latest_update: new Date(),
                before_img: item.before_img || null,
                after_img: item.after_img || null,
            });
            await newLineItem.save({ session });
            createdLineItems.push(newLineItem);
        }
        // Calculate total pairs (number of line items/shoes)
        const noPairs = createdLineItems.length;
        // Create transaction
        const transaction = new Transactions_1.Transaction({
            transaction_id: transactionId,
            line_item_id: createdLineItems.map((li) => li.line_item_id),
            cust_id: customer.cust_id,
            branch_id: data.branch_id,
            no_pairs: noPairs,
            no_released: data.no_released || 0,
            total_amount: data.total_amount,
            discount_amount: data.discount_amount,
            amount_paid: data.amount_paid,
            payment_status: data.payment_status,
            payments: [],
            payment_mode: data.payment_mode,
            received_by: data.received_by,
            date_in: data.date_in ? new Date(data.date_in) : new Date(),
        });
        // If there's an initial payment (amount_paid > 0), create a Payment record and attach
        if (data.amount_paid && data.amount_paid > 0) {
            // generate payment id
            const paymentId = await (0, generatePaymentId_1.generatePaymentId)(branch_code);
            const payment = new payments_1.Payment({
                payment_id: paymentId,
                transaction_id: transactionId,
                payment_amount: data.amount_paid,
                payment_mode: data.payment_mode,
                payment_date: new Date(),
            });
            await payment.save({ session });
            // attach payment id to transaction
            transaction.payments = [paymentId];
        }
        await transaction.save({ session });
        await session.commitTransaction();
        session.endSession();
        return res.status(201).json({
            success: true,
            customer,
            lineItems: createdLineItems,
            transaction,
        });
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error(error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return res.status(500).json({ success: false, error: message });
    }
};
exports.createServiceRequest = createServiceRequest;
