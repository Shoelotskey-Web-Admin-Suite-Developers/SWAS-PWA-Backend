"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBranchByBranchId = exports.getBranches = void 0;
const Branch_1 = require("../models/Branch");
// Get all branches
const getBranches = async (req, res) => {
    try {
        const branches = await Branch_1.Branch.find();
        res.status(200).json(branches);
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching branches", error });
    }
};
exports.getBranches = getBranches;
// Get single branch by branch_id
const getBranchByBranchId = async (req, res) => {
    try {
        const { branchId } = req.params;
        if (!branchId)
            return res.status(400).json({ error: 'branchId param is required' });
        const branch = await Branch_1.Branch.findOne({ branch_id: branchId });
        if (!branch)
            return res.status(404).json({ error: 'Branch not found' });
        return res.status(200).json({
            branch: {
                _id: branch._id,
                branch_id: branch.branch_id,
                branch_name: branch.branch_name,
                branch_code: branch.branch_code,
                branch_number: branch.branch_number,
                location: branch.location,
                type: branch.type,
            },
        });
    }
    catch (err) {
        console.error('Error fetching branch by id:', err);
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};
exports.getBranchByBranchId = getBranchByBranchId;
