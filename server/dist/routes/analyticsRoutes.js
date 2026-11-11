"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const analyticsController_1 = require("../controllers/analyticsController");
const router = express_1.default.Router();
router.get("/daily-revenue", analyticsController_1.getDailyRevenue);
router.get("/forecast", analyticsController_1.getForecast);
router.get("/weekly-revenue", analyticsController_1.getWeeklyRevenue);
router.get("/weekly-forecast", analyticsController_1.getWeeklyForecast);
router.get("/monthly-revenue", analyticsController_1.getMonthlyRevenue);
router.get("/top-services", analyticsController_1.getTopServices);
router.get("/sales-breakdown", analyticsController_1.getSalesBreakdown);
exports.default = router;
