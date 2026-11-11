"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/lineItemRoutes.ts
const express_1 = require("express");
const lineItemController_1 = require("../controllers/lineItemController");
const router = (0, express_1.Router)();
router.get("/status/:status", lineItemController_1.getLineItemsByStatus);
router.get("/branch/:branch_id", lineItemController_1.getLineItemsByBranchId);
router.get("/location/:location", lineItemController_1.getLineItemsByLocation);
router.get("/transaction/:transaction_id", lineItemController_1.getLineItemsByTransactionId);
router.get("/", lineItemController_1.getAllLineItems);
router.put("/status", lineItemController_1.updateLineItemStatus); // new route for updating status
router.put("/:line_item_id/image", lineItemController_1.updateLineItemImage);
router.put("/:line_item_id/storage-fee", lineItemController_1.updateLineItemStorageFee);
router.put("/:line_item_id/location", lineItemController_1.updateLineItemLocation);
router.put("/:line_item_id", lineItemController_1.updateLineItem); // Add this new general update route
router.delete("/transaction/:transaction_id", lineItemController_1.deleteLineItemsByTransactionId); // Add this route
exports.default = router;
