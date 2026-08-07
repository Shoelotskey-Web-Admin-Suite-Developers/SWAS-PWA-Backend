"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteLineItemsByTransactionId = exports.updateLineItem = exports.getLineItemsByTransactionId = exports.updateLineItemLocation = exports.updateLineItemStorageFee = exports.updateLineItemImage = exports.updateLineItemStatus = exports.getLineItemsByLocation = exports.getLineItemsByBranchId = exports.getAllLineItems = exports.getLineItemsByStatus = void 0;
const LineItem_1 = require("../models/LineItem");
const pushNotifications_1 = require("../utils/pushNotifications");
// GET /line-items/status/:status
const getLineItemsByStatus = async (req, res) => {
    const { status } = req.params;
    try {
        const items = await LineItem_1.LineItem.find({ current_status: status });
        if (!items || items.length === 0) {
            return res.status(404).json({ message: `No line items found with status "${status}"` });
        }
        res.status(200).json(items);
    }
    catch (error) {
        console.error("Error fetching line items by status:", error);
        res.status(500).json({ message: "Server error fetching line items" });
    }
};
exports.getLineItemsByStatus = getLineItemsByStatus;
// GET /line-items
// Return all line items except those that are already Picked Up
const getAllLineItems = async (req, res) => {
    try {
        // Build base filter: exclude items already 'Picked Up'
        const branch_id = req.query.branch_id;
        const filter = { current_status: { $ne: 'Picked Up' } };
        if (branch_id) {
            filter.branch_id = branch_id;
        }
        // Diagnostic: log counts to help debug why only one item is returned
        const totalInCollection = await LineItem_1.LineItem.countDocuments();
        const totalNotPickedUp = await LineItem_1.LineItem.countDocuments({ current_status: { $ne: 'Picked Up' } });
        const totalMatchingFilter = await LineItem_1.LineItem.countDocuments(filter);
        console.debug('getAllLineItems: totalInCollection=', totalInCollection);
        console.debug('getAllLineItems: totalNotPickedUp=', totalNotPickedUp);
        console.debug('getAllLineItems: totalMatchingFilter=', totalMatchingFilter, 'filter=', filter);
        const items = await LineItem_1.LineItem.find(filter);
        if (!items || items.length === 0) {
            return res.status(404).json({ message: 'No line items found' });
        }
        // Also log a sample of returned ids for quick verification
        try {
            console.debug('getAllLineItems: returning line_item_ids=', items.map((i) => i.line_item_id).slice(0, 50));
        }
        catch (e) {
            // ignore
        }
        res.status(200).json(items);
    }
    catch (error) {
        console.error('Error fetching all line items:', error);
        res.status(500).json({ message: 'Server error fetching line items' });
    }
};
exports.getAllLineItems = getAllLineItems;
// GET /line-items/branch/:branch_id
const getLineItemsByBranchId = async (req, res) => {
    const { branch_id } = req.params;
    if (!branch_id) {
        return res.status(400).json({ message: "branch_id is required in params" });
    }
    try {
        const items = await LineItem_1.LineItem.find({ branch_id });
        if (!items || items.length === 0) {
            return res.status(404).json({ message: `No line items found for branch_id "${branch_id}"` });
        }
        res.status(200).json(items);
    }
    catch (error) {
        console.error("Error fetching line items by branch_id:", error);
        res.status(500).json({ message: "Server error fetching line items" });
    }
};
exports.getLineItemsByBranchId = getLineItemsByBranchId;
// GET /line-items/location/:location
const getLineItemsByLocation = async (req, res) => {
    const { location } = req.params;
    if (!location) {
        return res.status(400).json({ message: "location param is required" });
    }
    try {
        const normalized = location.trim();
        // Match by current_location only
        const items = await LineItem_1.LineItem.find({ current_location: normalized });
        if (!items || items.length === 0) {
            return res
                .status(404)
                .json({ message: `No line items found for current_location "${normalized}"` });
        }
        res.status(200).json(items);
    }
    catch (error) {
        console.error("Error fetching line items by current_location:", error);
        res.status(500).json({ message: "Server error fetching line items by current_location" });
    }
};
exports.getLineItemsByLocation = getLineItemsByLocation;
// PUT /line-items/status
const updateLineItemStatus = async (req, res) => {
    const { line_item_ids, new_status } = req.body;
    if (!line_item_ids || !new_status) {
        return res.status(400).json({ message: "line_item_ids and new_status are required" });
    }
    try {
        const updateFields = {
            current_status: new_status,
            latest_update: new Date(),
        };
        // If marking as Ready for Pickup, set pickUpNotice
        if (new_status === "Ready for Pickup") {
            updateFields.pickUpNotice = new Date();
        }
        const result = await LineItem_1.LineItem.updateMany({ line_item_id: { $in: line_item_ids } }, updateFields);
        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "No line items found to update" });
        }
        // Send push notifications if status is "Ready for Pickup"
        if (new_status === "Ready for Pickup") {
            try {
                // Find the updated line items to get customer details
                const lineItems = await LineItem_1.LineItem.find({ line_item_id: { $in: line_item_ids } });
                // Group items by customer for consolidated notifications
                const customerItems = new Map();
                lineItems.forEach(item => {
                    if (item.cust_id) {
                        if (!customerItems.has(item.cust_id)) {
                            customerItems.set(item.cust_id, []);
                        }
                        customerItems.get(item.cust_id)?.push(item);
                    }
                });
                // Send notifications to each customer
                for (const [custId, items] of customerItems.entries()) {
                    // Only proceed if we have a customer ID
                    if (custId) {
                        const shoesCount = items.length;
                        const notificationTitle = "Your Shoes Are Ready for Pickup";
                        const notificationBody = shoesCount === 1
                            ? `You can now collect your ${items[0].shoes || 'item'} at the shop!`
                            : `${shoesCount} items are ready for pickup!`;
                        const notificationData = {
                            type: "pickup_ready",
                            lineItemIds: items.map(item => item.line_item_id),
                            count: shoesCount
                        };
                        // Send push notification (non-blocking)
                        try {
                            const pushResult = await (0, pushNotifications_1.sendPushNotification)(custId, notificationTitle, notificationBody, notificationData);
                            if (!pushResult.success) {
                                console.warn(`Push notification failed for customer ${custId}:`, pushResult.error);
                            }
                            else {
                                console.log(`Push notification sent successfully to customer ${custId} for ${shoesCount} items`);
                            }
                        }
                        catch (notifError) {
                            console.error(`Error sending push notification to customer ${custId}:`, notifError);
                        }
                    }
                }
            }
            catch (notificationError) {
                // Log but don't fail the status update if notifications have issues
                console.error("Error sending ready-for-pickup notifications:", notificationError);
            }
        }
        res.status(200).json({ message: `${result.modifiedCount} line item(s) updated to "${new_status}"` });
    }
    catch (error) {
        console.error("Error updating line item status:", error);
        res.status(500).json({ message: "Server error updating line items" });
    }
};
exports.updateLineItemStatus = updateLineItemStatus;
// PUT /line-items/:line_item_id/image
const updateLineItemImage = async (req, res) => {
    const { line_item_id } = req.params;
    const { type, url } = req.body; // type: "before" | "after", url: string
    if (!line_item_id) {
        return res.status(400).json({ message: "line_item_id is required in params" });
    }
    if (!["before", "after"].includes(type) || !url) {
        return res.status(400).json({ message: "type ('before' or 'after') and url are required" });
    }
    try {
        const updateField = type === "before" ? { before_img: url } : { after_img: url };
        const item = await LineItem_1.LineItem.findOneAndUpdate({ line_item_id }, updateField, { new: true });
        if (!item) {
            return res.status(404).json({ message: "Line item not found" });
        }
        res.status(200).json(item);
    }
    catch (error) {
        console.error("Error updating line item image:", error);
        res.status(500).json({ message: "Server error updating image" });
    }
};
exports.updateLineItemImage = updateLineItemImage;
// PUT /line-items/:line_item_id/storage-fee
const updateLineItemStorageFee = async (req, res) => {
    const { line_item_id } = req.params;
    const { storage_fee } = req.body;
    if (!line_item_id) {
        return res.status(400).json({ message: 'line_item_id is required in params' });
    }
    const feeNum = Number(storage_fee ?? NaN);
    if (!Number.isFinite(feeNum) || feeNum < 0) {
        return res.status(400).json({ message: 'storage_fee must be a non-negative number' });
    }
    try {
        // Increment the existing storage_fee by the provided amount instead of replacing it
        const updated = await LineItem_1.LineItem.findOneAndUpdate({ line_item_id }, { $inc: { storage_fee: feeNum }, $set: { latest_update: new Date() } }, { new: true });
        if (!updated) {
            return res.status(404).json({ message: 'Line item not found' });
        }
        return res.status(200).json({ message: 'Storage fee added', lineItem: updated });
    }
    catch (error) {
        console.error('Error updating storage fee for line item:', error);
        return res.status(500).json({ message: 'Server error updating storage fee' });
    }
};
exports.updateLineItemStorageFee = updateLineItemStorageFee;
// PUT /line-items/:line_item_id/location
const updateLineItemLocation = async (req, res) => {
    const { line_item_id } = req.params;
    const { current_location } = req.body;
    if (!line_item_id) {
        return res.status(400).json({ message: "line_item_id is required in params" });
    }
    if (!current_location) {
        return res.status(400).json({ message: "current_location is required in body" });
    }
    // Validate location value (based on your schema enum)
    const validLocations = ["Hub", "Branch"];
    if (!validLocations.includes(current_location)) {
        return res.status(400).json({
            message: `Invalid location. Must be one of: ${validLocations.join(", ")}`
        });
    }
    try {
        const updated = await LineItem_1.LineItem.findOneAndUpdate({ line_item_id }, {
            current_location,
            latest_update: new Date()
        }, { new: true });
        if (!updated) {
            return res.status(404).json({ message: "Line item not found" });
        }
        res.status(200).json({
            message: `Location updated to "${current_location}"`,
            lineItem: updated
        });
    }
    catch (error) {
        console.error("Error updating line item location:", error);
        res.status(500).json({ message: "Server error updating location" });
    }
};
exports.updateLineItemLocation = updateLineItemLocation;
// GET /line-items/transaction/:transaction_id
const getLineItemsByTransactionId = async (req, res) => {
    const { transaction_id } = req.params;
    if (!transaction_id) {
        return res.status(400).json({ message: "transaction_id is required in params" });
    }
    try {
        const items = await LineItem_1.LineItem.find({ transaction_id });
        if (!items || items.length === 0) {
            return res.status(404).json({ message: `No line items found for transaction_id "${transaction_id}"` });
        }
        res.status(200).json(items);
    }
    catch (error) {
        console.error("Error fetching line items by transaction_id:", error);
        res.status(500).json({ message: "Server error fetching line items" });
    }
};
exports.getLineItemsByTransactionId = getLineItemsByTransactionId;
// PUT /line-items/:line_item_id
const updateLineItem = async (req, res) => {
    try {
        const { line_item_id } = req.params;
        const updates = req.body;
        if (!line_item_id) {
            return res.status(400).json({ error: "line_item_id required" });
        }
        // Find line item by line_item_id
        const lineItem = await LineItem_1.LineItem.findOne({ line_item_id });
        if (!lineItem) {
            return res.status(404).json({ error: "Line item not found" });
        }
        // Fields that should not be directly updated
        const restrictedFields = ['line_item_id', '_id', '__v', 'createdAt', 'updatedAt'];
        // Remove restricted fields from updates
        restrictedFields.forEach(field => delete updates[field]);
        // Special handling for current_status - ensure it's valid if provided
        if (updates.current_status) {
            // You may want to add validation logic here if needed
            // Also set latest_update when status changes
            updates.latest_update = new Date();
        }
        // If updating current_location, validate the value
        if (updates.current_location && !['Hub', 'Branch'].includes(updates.current_location)) {
            return res.status(400).json({ error: "Invalid current_location. Must be 'Hub' or 'Branch'" });
        }
        // Update the line item with the filtered updates
        Object.assign(lineItem, updates);
        // Save the updated line item
        await lineItem.save();
        return res.status(200).json({ success: true, lineItem });
    }
    catch (err) {
        console.error("Error updating line item:", err);
        let message = "Unknown error";
        if (err instanceof Error)
            message = err.message;
        return res.status(500).json({ error: "Server error", message });
    }
};
exports.updateLineItem = updateLineItem;
// DELETE /line-items/transaction/:transaction_id
const deleteLineItemsByTransactionId = async (req, res) => {
    try {
        const { transaction_id } = req.params;
        if (!transaction_id) {
            return res.status(400).json({ message: "transaction_id is required in params" });
        }
        const result = await LineItem_1.LineItem.deleteMany({ transaction_id });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: `No line items found for transaction_id "${transaction_id}"` });
        }
        res.status(200).json({
            success: true,
            message: `${result.deletedCount} line item(s) deleted for transaction_id "${transaction_id}"`
        });
    }
    catch (error) {
        console.error("Error deleting line items by transaction_id:", error);
        res.status(500).json({ message: "Server error deleting line items" });
    }
};
exports.deleteLineItemsByTransactionId = deleteLineItemsByTransactionId;
