"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const announcementsController_1 = require("../controllers/announcementsController");
const router = (0, express_1.Router)();
// Create announcement
router.post("/", announcementsController_1.createAnnouncement);
// Get announcements by branch_id (query param)
router.get("/", announcementsController_1.getAllAnnouncements);
// Update announcement by ID (announcement_id in params)
router.put("/:id", announcementsController_1.updateAnnouncement);
// Delete announcement by ID (announcement_id in params)
router.delete("/:id", announcementsController_1.deleteAnnouncement);
exports.default = router;
