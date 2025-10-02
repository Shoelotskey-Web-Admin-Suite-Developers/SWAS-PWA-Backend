"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const branchController_1 = require("../controllers/branchController");
const router = (0, express_1.Router)();
router.get("/", branchController_1.getBranches);
// GET branch by branch_id
router.get("/:branchId", branchController_1.getBranchByBranchId);
exports.default = router;
