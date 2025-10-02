"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUnavailability = exports.getUnavailabilityById = exports.getAllUnavailability = exports.addUnavailability = void 0;
const Unavailability_1 = require("../models/Unavailability");
// Helper: generate unique unavailability_id
const generateUnavailabilityId = async () => {
    const last = await Unavailability_1.Unavailability.findOne().sort({ _id: -1 });
    if (!last)
        return "UNAV-1";
    const lastNum = parseInt(last.unavailability_id.split("-")[1]);
    return `UNAV-${lastNum + 1}`;
};
// -------------------- CREATE --------------------
const addUnavailability = async (req, res) => {
    try {
        const { branch_id, date_unavailable, type, time_start, time_end, note } = req.body;
        if (!branch_id || !date_unavailable || !type) {
            return res.status(400).json({ error: "branch_id, date_unavailable, and type are required" });
        }
        if (type === "Partial Day" && (!time_start || !time_end)) {
            return res.status(400).json({ error: "time_start and time_end are required for Partial Day" });
        }
        const unavailability_id = await generateUnavailabilityId();
        const unavailability = new Unavailability_1.Unavailability({
            unavailability_id,
            branch_id,
            date_unavailable: new Date(date_unavailable),
            type,
            time_start: time_start || null,
            time_end: time_end || null,
            note: note || null,
        });
        const saved = await unavailability.save();
        return res.status(201).json({
            unavailability: {
                _id: saved._id,
                unavailability_id: saved.unavailability_id,
                branch_id: saved.branch_id,
                date_unavailable: saved.date_unavailable,
                type: saved.type,
                time_start: saved.time_start,
                time_end: saved.time_end,
                note: saved.note,
            },
        });
    }
    catch (err) {
        console.error("Error creating unavailability:", err);
        return res.status(500).json({ message: "Server error", error: err.message });
    }
};
exports.addUnavailability = addUnavailability;
// -------------------- GET ALL (optionally filter by branch_id) --------------------
const getAllUnavailability = async (req, res) => {
    try {
        const { branch_id, all } = req.query;
        let filter = {};
        if (!all) {
            if (!branch_id) {
                return res.status(400).json({ error: "branch_id query is required unless all=true" });
            }
            filter.branch_id = branch_id.toString();
        }
        const records = await Unavailability_1.Unavailability.find(filter).sort({ date_unavailable: 1 });
        const formatted = records.map((r) => ({
            _id: r._id,
            unavailability_id: r.unavailability_id,
            branch_id: r.branch_id,
            date_unavailable: r.date_unavailable,
            type: r.type,
            time_start: r.time_start,
            time_end: r.time_end,
            note: r.note,
        }));
        return res.status(200).json({ unavailabilities: formatted });
    }
    catch (err) {
        console.error("Error fetching unavailability:", err);
        return res.status(500).json({ message: "Server error", error: err.message });
    }
};
exports.getAllUnavailability = getAllUnavailability;
// -------------------- GET BY ID --------------------
const getUnavailabilityById = async (req, res) => {
    try {
        const { id } = req.params;
        const record = await Unavailability_1.Unavailability.findOne({ unavailability_id: id });
        if (!record) {
            return res.status(404).json({ error: "Unavailability not found" });
        }
        return res.status(200).json({
            unavailability: {
                _id: record._id,
                unavailability_id: record.unavailability_id,
                branch_id: record.branch_id,
                date_unavailable: record.date_unavailable,
                type: record.type,
                time_start: record.time_start,
                time_end: record.time_end,
                note: record.note,
            },
        });
    }
    catch (err) {
        console.error("Error fetching unavailability by ID:", err);
        return res.status(500).json({ message: "Server error", error: err.message });
    }
};
exports.getUnavailabilityById = getUnavailabilityById;
// -------------------- DELETE --------------------
const deleteUnavailability = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Unavailability_1.Unavailability.findOneAndDelete({ unavailability_id: id });
        if (!deleted) {
            return res.status(404).json({ error: "Unavailability not found" });
        }
        return res.status(200).json({
            message: "Unavailability deleted successfully",
            _id: deleted._id,
            unavailability_id: deleted.unavailability_id,
        });
    }
    catch (err) {
        console.error("Error deleting unavailability:", err);
        return res.status(500).json({ message: "Server error", error: err.message });
    }
};
exports.deleteUnavailability = deleteUnavailability;
