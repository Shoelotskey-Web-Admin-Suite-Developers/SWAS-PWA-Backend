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
exports.Unavailability = void 0;
/// src/models/Unavailability.ts
const mongoose_1 = __importStar(require("mongoose"));
const UnavailabilitySchema = new mongoose_1.Schema({
    unavailability_id: { type: String, required: true, unique: true }, // e.g., UNAV-001
    branch_id: { type: String, required: true, ref: "Branch" }, // FK to Branch collection
    date_unavailable: { type: Date, required: true },
    type: { type: String, enum: ["Full Day", "Partial Day"], required: true },
    time_start: { type: String, default: null }, // optional, store as "HH:mm"
    time_end: { type: String, default: null }, // optional, store as "HH:mm"
    note: { type: String, maxlength: 255, default: null }, // optional
});
exports.Unavailability = mongoose_1.default.model("Unavailability", UnavailabilitySchema, "unavailability");
