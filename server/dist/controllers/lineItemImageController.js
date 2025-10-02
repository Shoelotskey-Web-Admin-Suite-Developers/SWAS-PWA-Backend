"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadLineItemImage = void 0;
const cloudinary_1 = __importDefault(require("../utils/cloudinary"));
const LineItem_1 = require("../models/LineItem");
const streamifier_1 = __importDefault(require("streamifier"));
const uploadLineItemImage = async (req, res) => {
    const { line_item_id, type } = req.params; // type: "before" or "after"
    if (!req.file)
        return res.status(400).json({ message: "No image file provided" });
    try {
        const stream = cloudinary_1.default.uploader.upload_stream({ resource_type: "image" }, async (error, result) => {
            if (error || !result) {
                return res.status(500).json({ message: "Cloudinary upload failed", error });
            }
            // Update LineItem with image URL
            const updateField = type === "before" ? { before_img: result.secure_url } : { after_img: result.secure_url };
            const updated = await LineItem_1.LineItem.findOneAndUpdate({ line_item_id }, { $set: updateField }, { new: true });
            if (!updated)
                return res.status(404).json({ message: "LineItem not found" });
            res.status(200).json(updated);
        });
        streamifier_1.default.createReadStream(req.file.buffer).pipe(stream);
    }
    catch (err) {
        res.status(500).json({ message: "Server error uploading image", error: err });
    }
};
exports.uploadLineItemImage = uploadLineItemImage;
