"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCustomer = exports.deleteAllCustomers = exports.deleteCustomer = exports.getCustomerByNameAndBdate = exports.getCustomerById = exports.getCustomers = void 0;
const Customer_1 = require("../models/Customer");
// Get all customers
const getCustomers = async (req, res) => {
    try {
        const customers = await Customer_1.Customer.find();
        res.status(200).json(customers);
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching customers", error });
    }
};
exports.getCustomers = getCustomers;
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
// Delete all customers
const deleteAllCustomers = async (req, res) => {
    try {
        const result = await Customer_1.Customer.deleteMany({});
        res.status(200).json({ message: `${result.deletedCount} customers deleted successfully` });
    }
    catch (error) {
        res.status(500).json({ message: "Error deleting all customers", error });
    }
};
exports.deleteAllCustomers = deleteAllCustomers;
// Update customer by cust_id
const updateCustomer = async (req, res) => {
    try {
        const { cust_id } = req.params;
        const updateData = req.body;
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
