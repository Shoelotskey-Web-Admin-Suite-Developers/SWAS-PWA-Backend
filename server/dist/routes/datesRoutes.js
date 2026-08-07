"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const datesController_1 = require("../controllers/datesController");
const router = express_1.default.Router();
// GET /api/dates/:line_item_id
router.get("/:line_item_id", datesController_1.getDatesByLineItemId);
// PUT /api/dates
router.put("/", datesController_1.upsertDatesByLineItemId);
// DELETE /api/dates/:line_item_id
router.delete("/:line_item_id", datesController_1.deleteDatesByLineItemId); // Add this route
exports.default = router;
