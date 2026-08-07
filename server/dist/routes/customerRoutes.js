"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/customerRoutes.ts
const express_1 = require("express");
const customerController_1 = require("../controllers/customerController");
const router = (0, express_1.Router)();
router.get("/", customerController_1.getCustomers);
router.get("/archived", customerController_1.getArchivedCustomers);
router.get("/summary", customerController_1.getCustomerSummaries);
router.get("/search/by-name-birthday", customerController_1.getCustomerByNameAndBdate);
router.get("/search/by-name-phone", customerController_1.getCustomerByNameAndPhone);
router.get("/search/by-reference", customerController_1.getCustomerByReferenceNo);
router.get("/:cust_id", customerController_1.getCustomerById);
router.put("/:cust_id/credibility", customerController_1.updateCustomerCredibility);
router.put("/:cust_id", customerController_1.updateCustomer);
router.delete("/:cust_id", customerController_1.deleteCustomer);
// Delete all customers
router.delete("/", customerController_1.deleteAllCustomers);
exports.default = router;
