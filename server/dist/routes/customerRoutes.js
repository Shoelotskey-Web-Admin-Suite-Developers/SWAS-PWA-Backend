"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/customerRoutes.ts
const express_1 = require("express");
const customerController_1 = require("../controllers/customerController");
const router = (0, express_1.Router)();
router.get("/", customerController_1.getCustomers);
router.get("/search/by-name-birthday", customerController_1.getCustomerByNameAndBdate);
router.get("/:cust_id", customerController_1.getCustomerById);
router.put("/:cust_id", customerController_1.updateCustomer);
router.delete("/:cust_id", customerController_1.deleteCustomer);
// Delete all customers
router.delete("/", customerController_1.deleteAllCustomers);
exports.default = router;
