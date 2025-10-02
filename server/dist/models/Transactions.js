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
exports.Transaction = void 0;
/// src/models/Transactions.ts
const mongoose_1 = __importStar(require("mongoose"));
const TransactionSchema = new mongoose_1.Schema({
    transaction_id: { type: String, required: true, unique: true },
    line_item_id: [{ type: String, ref: "LineItem", required: true }],
    branch_id: { type: String, required: true, ref: "Branch" },
    date_in: { type: Date, required: true, default: Date.now },
    received_by: { type: String, required: true, maxlength: 50 },
    date_out: { type: Date, default: null },
    cust_id: { type: String, required: true, ref: "Customer" },
    no_pairs: { type: Number, default: 0 },
    no_released: { type: Number, default: 0 },
    total_amount: { type: Number, default: 0.0 },
    discount_amount: { type: Number, default: 0.0 },
    amount_paid: { type: Number, default: 0.0 },
    payment_status: {
        type: String,
        enum: ["NP", "PARTIAL", "PAID"],
        default: "NP",
        required: true,
    },
    payment_mode: { type: String, default: "" },
    payments: [
        {
            type: String,
            ref: "Payment", // links to Payment.payment_id
        },
    ],
}, { timestamps: true });
exports.Transaction = mongoose_1.default.model("Transaction", TransactionSchema, "transactions");
