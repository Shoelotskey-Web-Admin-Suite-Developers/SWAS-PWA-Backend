"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/lineItemRoutes.ts
const express_1 = require("express");
const lineItemController_1 = require("../controllers/lineItemController");
const router = (0, express_1.Router)();
router.get("/status/:status", lineItemController_1.getLineItemsByStatus);
router.get("/", lineItemController_1.getAllLineItems);
router.put("/status", lineItemController_1.updateLineItemStatus); // new route for updating status
router.put("/:line_item_id/image", lineItemController_1.updateLineItemImage);
router.put("/:line_item_id/storage-fee", lineItemController_1.updateLineItemStorageFee);
exports.default = router;
