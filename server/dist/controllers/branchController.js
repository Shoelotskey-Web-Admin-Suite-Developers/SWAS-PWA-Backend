"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBranch = exports.updateBranch = exports.createBranch = exports.getBranchByBranchId = exports.getBranches = void 0;
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
                fb_link: branch.fb_link,
                gmap_link: branch.gmap_link,
            },
        });
    }
    catch (err) {
        console.error('Error fetching branch by id:', err);
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};
exports.getBranchByBranchId = getBranchByBranchId;
// Create a new branch
const createBranch = async (req, res) => {
    try {
        const { branch_name, location, branch_code, type, fb_link, gmap_link } = req.body;
        console.log("Received branch data:", req.body);
        console.log("Received Google Maps link:", gmap_link);
        // Validate required fields
        if (!branch_name || !location || !branch_code || !type) {
            return res.status(400).json({
                message: "Branch name, location, branch code, and type are required"
            });
        }
        // Validate type
        if (!['H', 'B', 'W'].includes(type)) {
            return res.status(400).json({
                message: "Type must be one of: H, B, W"
            });
        }
        // Check if branch with same branch_code already exists
        const existingBranch = await Branch_1.Branch.findOne({ branch_code });
        if (existingBranch) {
            return res.status(400).json({
                message: "Branch with this code already exists"
            });
        }
        // Check if branch with same name already exists
        const existingBranchName = await Branch_1.Branch.findOne({ branch_name });
        if (existingBranchName) {
            return res.status(400).json({
                message: "Branch with this name already exists"
            });
        }
        // Generate branch number (auto-increment)
        const lastBranch = await Branch_1.Branch.findOne().sort({ branch_number: -1 });
        const branch_number = lastBranch ? lastBranch.branch_number + 1 : 1;
        // Generate branch_id: <CODE>-<TYPE>-<LOCATION_SHORT>
        const locationShort = location.substring(0, 3).toUpperCase();
        const branch_id = `${branch_code}-${type}-${locationShort}`;
        const newBranch = new Branch_1.Branch({
            branch_id,
            branch_name,
            branch_code,
            branch_number,
            location,
            type,
            fb_link: fb_link || null,
            gmap_link: gmap_link || null,
        });
        await newBranch.save();
        res.status(201).json({
            message: "Branch created successfully",
            branch: newBranch
        });
    }
    catch (error) {
        console.error('Error creating branch:', error);
        if (error.code === 11000) {
            return res.status(400).json({
                message: "Duplicate key error. Branch ID, branch number, or branch code already exists.",
                error: error.message
            });
        }
        res.status(500).json({
            message: "Error creating branch",
            error: error.message
        });
    }
};
exports.createBranch = createBranch;
// Update a branch
const updateBranch = async (req, res) => {
    try {
        const { branchId } = req.params;
        const { branch_name, location, branch_code, type, fb_link, gmap_link } = req.body;
        // Find the branch
        const branch = await Branch_1.Branch.findOne({ branch_id: branchId });
        if (!branch) {
            return res.status(404).json({ message: "Branch not found" });
        }
        // Check if SWAS-SUPERADMIN is being modified
        if (branchId === "SWAS-SUPERADMIN") {
            return res.status(403).json({
                message: "SWAS-SUPERADMIN branch cannot be modified"
            });
        }
        // Validate type if provided
        if (type && !['H', 'B', 'W'].includes(type)) {
            return res.status(400).json({
                message: "Type must be one of: H, B, W"
            });
        }
        // Check for duplicate branch_code if being updated
        if (branch_code && branch_code !== branch.branch_code) {
            const existingBranch = await Branch_1.Branch.findOne({ branch_code });
            if (existingBranch) {
                return res.status(400).json({
                    message: "Branch with this code already exists"
                });
            }
        }
        // Check for duplicate branch_name if being updated
        if (branch_name && branch_name !== branch.branch_name) {
            const existingBranchName = await Branch_1.Branch.findOne({ branch_name });
            if (existingBranchName) {
                return res.status(400).json({
                    message: "Branch with this name already exists"
                });
            }
        }
        // Update fields
        if (branch_name)
            branch.branch_name = branch_name;
        if (location) {
            branch.location = location;
            // Update branch_id if location changes
            const locationShort = location.substring(0, 3).toUpperCase();
            branch.branch_id = `${branch.branch_code}-${branch.type}-${locationShort}`;
        }
        if (branch_code) {
            branch.branch_code = branch_code;
            // Update branch_id if branch_code changes
            const locationShort = branch.location.substring(0, 3).toUpperCase();
            branch.branch_id = `${branch_code}-${branch.type}-${locationShort}`;
        }
        if (type) {
            branch.type = type;
            // Update branch_id if type changes
            const locationShort = branch.location.substring(0, 3).toUpperCase();
            branch.branch_id = `${branch.branch_code}-${type}-${locationShort}`;
        }
        if (fb_link !== undefined)
            branch.fb_link = fb_link;
        if (gmap_link !== undefined)
            branch.gmap_link = gmap_link;
        await branch.save();
        res.status(200).json({
            message: "Branch updated successfully",
            branch: branch
        });
    }
    catch (error) {
        console.error('Error updating branch:', error);
        if (error.code === 11000) {
            return res.status(400).json({
                message: "Duplicate key error. Branch ID, branch number, or branch code already exists.",
                error: error.message
            });
        }
        res.status(500).json({
            message: "Error updating branch",
            error: error.message
        });
    }
};
exports.updateBranch = updateBranch;
// Delete a branch
const deleteBranch = async (req, res) => {
    try {
        const { branchId } = req.params;
        // Check if SWAS-SUPERADMIN is being deleted
        if (branchId === "SWAS-SUPERADMIN") {
            return res.status(403).json({
                message: "SWAS-SUPERADMIN branch cannot be deleted"
            });
        }
        const branch = await Branch_1.Branch.findOne({ branch_id: branchId });
        if (!branch) {
            return res.status(404).json({ message: "Branch not found" });
        }
        await Branch_1.Branch.deleteOne({ branch_id: branchId });
        res.status(200).json({
            message: "Branch deleted successfully"
        });
    }
    catch (error) {
        console.error('Error deleting branch:', error);
        res.status(500).json({
            message: "Error deleting branch",
            error: error.message
        });
    }
};
exports.deleteBranch = deleteBranch;
