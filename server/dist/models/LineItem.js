"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LineItem = void 0;
// src/models/LineItem.ts
const mongoose_1 = __importStar(require("mongoose"));
const LineItemServiceSchema = new mongoose_1.Schema({
    service_id: { type: String, ref: "Service", required: true },
    quantity: { type: Number, default: 1, min: 1 },
}, { _id: false } // subdocs don't need their own ids
);
const LineItemSchema = new mongoose_1.Schema({
    line_item_id: { type: String, required: true, unique: true },
    transaction_id: { type: String, required: true, ref: "Transaction" },
    priority: { type: String, enum: ["Rush", "Normal"], default: "Normal" },
    cust_id: { type: String, required: true, ref: "Customer" },
    services: { type: [LineItemServiceSchema], required: true }, // canonical persisted shape
    storage_fee: { type: Number, default: 0 },
    branch_id: { type: String, required: true },
    shoes: { type: String, required: true },
    current_location: { type: String, enum: ["Hub", "Branch"], required: true },
    current_status: { type: String, required: true },
    due_date: { type: Date, default: null },
    latest_update: { type: Date, default: Date.now },
    before_img: { type: String, default: null },
    after_img: { type: String, default: null },
    pickUpNotice: { type: Date, default: null }, // <-- added field, default null
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
exports.LineItem = mongoose_1.default.model("LineItem", LineItemSchema, "line_items");
