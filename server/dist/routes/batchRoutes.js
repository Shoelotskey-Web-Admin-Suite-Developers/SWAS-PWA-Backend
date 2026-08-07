"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const batchController_1 = require("../controllers/batchController");
const router = express_1.default.Router();
// Route to archive all data
router.put("/archive-all", batchController_1.archiveAllData);
// Route to delete all data (kept for backward compatibility)
router.delete("/delete-all", batchController_1.deleteAllData);
exports.default = router;
