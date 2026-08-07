"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserName = exports.getUserPosition = exports.editUser = exports.deleteUser = exports.getUsers = exports.addUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const Users_1 = require("../models/Users");
const addUser = async (req, res) => {
    try {
        const { user_id, branch_id, user_name, password, position } = req.body;
        if (!user_id || !branch_id || !password) {
            return res.status(400).json({ message: "user_id, branch_id, and password are required." });
        }
        // Check if user_id already exists
        const existingUser = await Users_1.User.findOne({ user_id });
        if (existingUser) {
            return res.status(409).json({ message: "User ID already exists." });
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const newUser = new Users_1.User({
            user_id,
            branch_id,
            user_name: typeof user_name === "string" && user_name.trim().length > 0 ? user_name.trim() : undefined,
            password: hashedPassword,
            position: position ?? undefined,
        });
        await newUser.save();
        return res.status(201).json({
            message: "User created successfully",
            user: {
                user_id: newUser.user_id,
                branch_id: newUser.branch_id,
                user_name: newUser.user_name ?? null,
                position: newUser.position,
            },
        });
    }
    catch (error) {
        console.error("Error adding user:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
exports.addUser = addUser;
// Get all users
const getUsers = async (req, res) => {
    try {
        const users = await Users_1.User.find({}, { password: 0 }); // exclude password
        return res.status(200).json(users);
    }
    catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
exports.getUsers = getUsers;
// Delete a user by user_id
const deleteUser = async (req, res) => {
    try {
        const { user_id } = req.params;
        if (!user_id) {
            return res.status(400).json({ message: "User ID is required." });
        }
        const deletedUser = await Users_1.User.findOneAndDelete({ user_id });
        if (!deletedUser) {
            return res.status(404).json({ message: "User not found." });
        }
        return res.status(200).json({ message: "User deleted successfully." });
    }
    catch (error) {
        console.error("Error deleting user:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
exports.deleteUser = deleteUser;
// Edit a user by user_id (user_id is read-only)
const editUser = async (req, res) => {
    try {
        const { user_id } = req.params; // identify the user
        const { branch_id, user_name, password, position } = req.body;
        if (!user_id) {
            return res.status(400).json({ message: "User ID is required." });
        }
        const user = await Users_1.User.findOne({ user_id });
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        if (branch_id)
            user.branch_id = branch_id;
        if (typeof user_name === "string") {
            const trimmed = user_name.trim();
            user.user_name = trimmed.length > 0 ? trimmed : null;
        }
        if (password)
            user.password = await bcryptjs_1.default.hash(password, 10);
        if (typeof position === "string" && position.trim().length > 0)
            user.position = position.trim();
        await user.save();
        return res.status(200).json({
            message: "User updated successfully",
            user: {
                user_id: user.user_id,
                branch_id: user.branch_id,
                user_name: user.user_name ?? null,
                position: user.position,
            },
        });
    }
    catch (error) {
        console.error("Error updating user:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
exports.editUser = editUser;
// Get a user's position by user_id
const getUserPosition = async (req, res) => {
    try {
        const { user_id } = req.params;
        if (!user_id) {
            return res.status(400).json({ message: "User ID is required." });
        }
        const user = await Users_1.User.findOne({ user_id }, { user_id: 1, position: 1, _id: 0 });
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        return res.status(200).json({ user_id: user.user_id, position: user.position ?? null });
    }
    catch (error) {
        console.error("Error fetching user position:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
exports.getUserPosition = getUserPosition;
// Get a user's name by user_id
const getUserName = async (req, res) => {
    try {
        const { user_id } = req.params;
        if (!user_id) {
            return res.status(400).json({ message: "User ID is required." });
        }
        const user = await Users_1.User.findOne({ user_id }, { user_id: 1, user_name: 1, _id: 0 });
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        return res.status(200).json({ user_id: user.user_id, user_name: user.user_name ?? null });
    }
    catch (error) {
        console.error("Error fetching user name:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
exports.getUserName = getUserName;
