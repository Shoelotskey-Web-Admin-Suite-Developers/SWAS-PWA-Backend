"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMonthlyRevenue = exports.getForecast = exports.getDailyRevenue = void 0;
const DailyRevenue_1 = require("../models/DailyRevenue");
const Forecast_1 = require("../models/Forecast");
const MonthlyRevenue_1 = require("../models/MonthlyRevenue");
const getDailyRevenue = async (req, res) => {
    try {
        // Return all daily revenue records sorted by date ascending
        const records = await DailyRevenue_1.DailyRevenue.find().sort({ date: 1 }).lean();
        return res.status(200).json(records);
    }
    catch (err) {
        console.error("Error fetching daily revenue:", err);
        return res.status(500).json({ error: "Failed to fetch daily revenue" });
    }
};
exports.getDailyRevenue = getDailyRevenue;
const getForecast = async (req, res) => {
    try {
        // Return all forecast records sorted by date ascending
        const records = await Forecast_1.Forecast.find().sort({ date: 1 }).lean();
        return res.status(200).json(records);
    }
    catch (err) {
        console.error("Error fetching forecast:", err);
        return res.status(500).json({ error: "Failed to fetch forecast" });
    }
};
exports.getForecast = getForecast;
const getMonthlyRevenue = async (req, res) => {
    try {
        // Return all monthly revenue records sorted by Year and month field
        const records = await MonthlyRevenue_1.MonthlyRevenue.find().sort({ Year: 1, month: 1 }).lean();
        console.log("Found monthly revenue records:", records.length);
        if (records.length > 0) {
            console.log("Sample record:", records[0]);
            console.log("Record keys:", Object.keys(records[0]));
        }
        // If no records found, return empty array
        if (records.length === 0) {
            console.log("No monthly revenue records found in database");
            return res.status(200).json([]);
        }
        // Transform the data to match the frontend format expected by MonthlyGrowth component
        const transformedData = records.map((record) => {
            // Convert month name (Jan, Feb, etc.) to month number
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthIndex = monthNames.indexOf(record.month);
            const monthNumber = monthIndex !== -1 ? monthIndex + 1 : 1;
            const monthStr = record.Year.toString() + "-" + monthNumber.toString().padStart(2, "0");
            // Get branch values - use the correct branch codes from the data structure
            return {
                month: monthStr,
                total: record.total || 0,
                SMVal: record["SMVAL-B-NCR"] || 0,
                Val: record["VAL-B-NCR"] || 0,
                SMGra: record["SMGRA-B-NCR"] || 0,
            };
        });
        console.log("Transformed data sample:", transformedData.slice(0, 2));
        return res.status(200).json(transformedData);
    }
    catch (err) {
        console.error("Error fetching monthly revenue:", err);
        return res.status(500).json({ error: "Failed to fetch monthly revenue" });
    }
};
exports.getMonthlyRevenue = getMonthlyRevenue;
