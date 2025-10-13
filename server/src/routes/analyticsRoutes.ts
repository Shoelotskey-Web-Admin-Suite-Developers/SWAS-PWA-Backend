import express from "express"
import { getDailyRevenue, getForecast, getMonthlyRevenue, getTopServices, getSalesBreakdown, getWeeklyRevenue, getWeeklyForecast } from "../controllers/analyticsController"

const router = express.Router()

router.get("/daily-revenue", getDailyRevenue)
router.get("/forecast", getForecast)
router.get("/weekly-revenue", getWeeklyRevenue)
router.get("/weekly-forecast", getWeeklyForecast)
router.get("/monthly-revenue", getMonthlyRevenue)
router.get("/top-services", getTopServices)
router.get("/sales-breakdown", getSalesBreakdown)

export default router
