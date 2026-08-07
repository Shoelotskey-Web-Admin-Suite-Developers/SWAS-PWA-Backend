"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCustomerCredibility = exports.updateCustomer = exports.getArchivedCustomers = exports.deleteAllCustomers = exports.deleteCustomer = exports.getCustomerByReferenceNo = exports.getCustomerByNameAndPhone = exports.getCustomerByNameAndBdate = exports.getCustomerById = exports.getCustomerSummaries = exports.getCustomers = void 0;
const Customer_1 = require("../models/Customer");
const Appointments_1 = require("../models/Appointments");
// Get all customers (non-archived by default)
const getCustomers = async (req, res) => {
    try {
        const { includeArchived } = req.query;
        const filter = includeArchived === 'true' ? {} : { is_archive: { $ne: true } };
        const customers = await Customer_1.Customer.find(filter);
        res.status(200).json(customers);
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching customers", error });
    }
};
exports.getCustomers = getCustomers;
// Get computed customer summaries (balance, current services, status)
const getCustomerSummaries = async (req, res) => {
    try {
        const { includeArchived } = req.query;
        const matchStage = includeArchived === 'true' ? {} : { is_archive: { $ne: true } };
        const summaries = await Customer_1.Customer.aggregate([
            {
                $match: matchStage
            },
            {
                $lookup: {
                    from: "transactions",
                    let: { customerId: "$cust_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$cust_id", "$$customerId"] },
                            },
                        },
                        {
                            $project: {
                                balanceContribution: {
                                    $let: {
                                        vars: {
                                            diff: {
                                                $subtract: [
                                                    { $ifNull: ["$total_amount", 0] },
                                                    { $ifNull: ["$amount_paid", 0] },
                                                ],
                                            },
                                        },
                                        in: {
                                            $cond: [{ $gt: ["$$diff", 0] }, "$$diff", 0],
                                        },
                                    },
                                },
                            },
                        },
                        {
                            $group: {
                                _id: null,
                                totalBalance: { $sum: "$balanceContribution" },
                            },
                        },
                    ],
                    as: "transactionSummary",
                },
            },
            {
                $lookup: {
                    from: "line_items",
                    let: { customerId: "$cust_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$cust_id", "$$customerId"] },
                                        { $ne: ["$current_status", "Picked Up"] },
                                    ],
                                },
                            },
                        },
                        {
                            $count: "currentServiceCount",
                        },
                    ],
                    as: "lineItemSummary",
                },
            },
            {
                $addFields: {
                    balance: {
                        $ifNull: [{ $arrayElemAt: ["$transactionSummary.totalBalance", 0] }, 0],
                    },
                    currentServiceCount: {
                        $ifNull: [{ $arrayElemAt: ["$lineItemSummary.currentServiceCount", 0] }, 0],
                    },
                },
            },
            {
                $addFields: {
                    status: {
                        $cond: [{ $gt: ["$currentServiceCount", 0] }, "Active", "Dormant"],
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    cust_id: 1,
                    cust_name: 1,
                    cust_bdate: 1,
                    cust_address: 1,
                    cust_email: 1,
                    cust_contact: 1,
                    total_services: 1,
                    total_expenditure: 1,
                    balance: 1,
                    currentServiceCount: 1,
                    status: 1,
                    is_archive: 1,
                },
            },
            {
                $sort: { cust_name: 1 },
            },
        ]);
        res.status(200).json(summaries);
    }
    catch (error) {
        console.error("Error computing customer summaries:", error);
        res.status(500).json({ message: "Error computing customer summaries", error });
    }
};
exports.getCustomerSummaries = getCustomerSummaries;
// Get customer by ID
const getCustomerById = async (req, res) => {
    try {
        const { cust_id } = req.params;
        const customer = await Customer_1.Customer.findOne({ cust_id });
        if (!customer) {
            res.status(404).json({ message: "Customer not found" });
            return;
        }
        res.status(200).json(customer);
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching customer", error });
    }
};
exports.getCustomerById = getCustomerById;
// Get customer by name and birthday
const getCustomerByNameAndBdate = async (req, res) => {
    try {
        const { cust_name, cust_bdate } = req.query;
        if (!cust_name || !cust_bdate) {
            res.status(400).json({ message: "cust_name and cust_bdate are required" });
            return;
        }
        // Parse birthday string into a Date range
        const birthdate = new Date(cust_bdate);
        const startOfDay = new Date(birthdate);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(birthdate);
        endOfDay.setUTCHours(23, 59, 59, 999);
        // Search by case-insensitive name + birthdate within day range
        const customer = await Customer_1.Customer.findOne({
            cust_name: { $regex: new RegExp(`^${cust_name}$`, "i") },
            cust_bdate: { $gte: startOfDay, $lte: endOfDay },
        });
        if (!customer) {
            res.status(404).json({ message: "Customer not found" });
            return;
        }
        res.status(200).json(customer);
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching customer by name and birthday", error });
    }
};
exports.getCustomerByNameAndBdate = getCustomerByNameAndBdate;
// Get customer by name and phone
const getCustomerByNameAndPhone = async (req, res) => {
    try {
        const { cust_name, cust_contact } = req.query;
        if (!cust_name || !cust_contact) {
            res.status(400).json({ message: "cust_name and cust_contact are required" });
            return;
        }
        // Search by case-insensitive exact name and exact phone/contact
        const customer = await Customer_1.Customer.findOne({
            cust_name: { $regex: new RegExp(`^${cust_name}$`, "i") },
            cust_contact: String(cust_contact),
        });
        if (!customer) {
            res.status(404).json({ message: "Customer not found" });
            return;
        }
        res.status(200).json(customer);
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching customer by name and phone", error });
    }
};
exports.getCustomerByNameAndPhone = getCustomerByNameAndPhone;
const getCustomerByReferenceNo = async (req, res) => {
    try {
        const referenceParam = (req.query.reference_no ?? req.query.referenceNo)?.toString().trim();
        if (!referenceParam) {
            res.status(400).json({ message: "reference_no is required" });
            return;
        }
        const appointment = await Appointments_1.Appointment.findOne({ reference_no: referenceParam }).lean();
        if (!appointment) {
            res.status(404).json({ message: "Appointment not found for the provided reference number" });
            return;
        }
        const customer = await Customer_1.Customer.findOne({ cust_id: appointment.cust_id }).lean();
        if (!customer) {
            res.status(404).json({ message: "Customer not found for the provided reference number" });
            return;
        }
        res.status(200).json(customer);
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching customer by reference number", error });
    }
};
exports.getCustomerByReferenceNo = getCustomerByReferenceNo;
// Delete customer by cust_id
const deleteCustomer = async (req, res) => {
    try {
        const { cust_id } = req.params;
        const deleted = await Customer_1.Customer.findOneAndDelete({ cust_id });
        if (!deleted) {
            res.status(404).json({ message: "Customer not found" });
            return;
        }
        res.status(200).json({ message: "Customer deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Error deleting customer", error });
    }
};
exports.deleteCustomer = deleteCustomer;
// Archive all customers (set is_archive: true instead of deleting)
const deleteAllCustomers = async (req, res) => {
    try {
        const result = await Customer_1.Customer.updateMany({ is_archive: { $ne: true } }, // Only archive non-archived customers
        { $set: { is_archive: true } });
        res.status(200).json({ message: `${result.modifiedCount} customers archived successfully` });
    }
    catch (error) {
        res.status(500).json({ message: "Error archiving customers", error });
    }
};
exports.deleteAllCustomers = deleteAllCustomers;
// Get archived customers only
const getArchivedCustomers = async (req, res) => {
    try {
        const customers = await Customer_1.Customer.find({ is_archive: true });
        res.status(200).json(customers);
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching archived customers", error });
    }
};
exports.getArchivedCustomers = getArchivedCustomers;
// Update customer by cust_id
const updateCustomer = async (req, res) => {
    try {
        const { cust_id } = req.params;
        const updateData = req.body;
        // Log archive/restore operations for customers
        if (updateData.hasOwnProperty('is_archive')) {
            console.log(`Customer ${cust_id} is_archive updated to: ${updateData.is_archive}`);
        }
        const updated = await Customer_1.Customer.findOneAndUpdate({ cust_id }, updateData, { new: true, runValidators: true } // return updated doc + validate schema
        );
        if (!updated) {
            res.status(404).json({ message: "Customer not found" });
            return;
        }
        res.status(200).json(updated);
    }
    catch (error) {
        res.status(500).json({ message: "Error updating customer", error });
    }
};
exports.updateCustomer = updateCustomer;
// Update customer credibility score
const updateCustomerCredibility = async (req, res) => {
    try {
        const { cust_id } = req.params;
        const { action } = req.body;
        if (!action || !["verify_arrival", "flag_missed"].includes(action)) {
            res.status(400).json({ message: "Invalid action. Must be 'verify_arrival' or 'flag_missed'" });
            return;
        }
        const customer = await Customer_1.Customer.findOne({ cust_id });
        if (!customer) {
            res.status(404).json({ message: "Customer not found" });
            return;
        }
        // Calculate new credibility score
        let newCredibility = customer.credibility || 100;
        if (action === "verify_arrival") {
            newCredibility = Math.min(newCredibility + 7, 120); // Max 120
        }
        else if (action === "flag_missed") {
            newCredibility = Math.max(newCredibility - 10, 70); // Min 70
        }
        // Update customer
        customer.credibility = newCredibility;
        await customer.save();
        // Determine if customer can still book (credibility > 75)
        const canBook = newCredibility > 75;
        res.status(200).json({
            success: true,
            credibility: newCredibility,
            canBook,
            message: `Credibility ${action === "verify_arrival" ? "increased" : "decreased"} successfully`
        });
    }
    catch (error) {
        res.status(500).json({ message: "Error updating customer credibility", error });
    }
};
exports.updateCustomerCredibility = updateCustomerCredibility;
