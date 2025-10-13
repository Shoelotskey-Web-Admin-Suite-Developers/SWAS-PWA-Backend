import express from "express";
import { deleteAllData, archiveAllData } from "../controllers/batchController";

const router = express.Router();

// Route to archive all data
router.put("/archive-all", archiveAllData);
// Route to delete all data (kept for backward compatibility)
router.delete("/delete-all", deleteAllData);

export default router;