"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/branchRoutes.ts
const express_1 = require("express");
const branchController_1 = require("../controllers/branchController");
const router = (0, express_1.Router)();
// Get all branches
router.get("/", branchController_1.getBranches);
// Get branch by branch_id
router.get("/:branchId", branchController_1.getBranchByBranchId);
// Create a new branch
router.post("/", branchController_1.createBranch);
// Update a branch
router.put("/:branchId", branchController_1.updateBranch);
// Delete a branch
router.delete("/:branchId", branchController_1.deleteBranch);
exports.default = router;
