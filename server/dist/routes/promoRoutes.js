"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const promoController_1 = require("../controllers/promoController");
const router = (0, express_1.Router)();
// Create promo
router.post("/", promoController_1.createPromo);
// Get promos by branch_id (query param)
router.get("/", promoController_1.getAllPromos);
// Update promo by ID (promo_id in params)
router.put("/:id", promoController_1.updatePromo);
// Delete promo by ID (promo_id in params)
router.delete("/:id", promoController_1.deletePromo);
exports.default = router;
