import { Request, Response } from "express";
import { LineItem } from "../models/LineItem";
import { Transaction } from "../models/Transactions";
import { Dates } from "../models/Dates";
import mongoose from "mongoose";

const CONFIRMATION_CODE = "CONFIRM_DELETE"; // You can set this to any value you want

/**
 * Archive all records by setting is_archive to true
 */
export const archiveAllData = async (req: Request, res: Response) => {
  const { confirmationCode } = req.body;
  
  // Simple validation to prevent accidental archiving
  if (!confirmationCode || confirmationCode !== CONFIRMATION_CODE) {
    return res.status(400).json({
      success: false,
      message: "Invalid confirmation code. Data archiving aborted."
    });
  }
  
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    // Archive records from all tables by setting is_archive to true
    const results = await Promise.all([
      LineItem.updateMany({}, { is_archive: true }).session(session),
      Transaction.updateMany({}, { is_archive: true }).session(session),
      // Note: We don't archive Dates as it doesn't have customer-facing data
    ]);
    
    await session.commitTransaction();
    
    // Calculate total archived records
    const totalArchived = results.reduce((sum, result) => sum + result.modifiedCount, 0);
    
    return res.status(200).json({ 
      success: true,
      message: `All data has been archived successfully. ${totalArchived} records were archived.`,
      archivedCount: totalArchived
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Batch archive error:", error);
    
    return res.status(500).json({
      success: false,
      message: "Failed to archive data",
      error: error instanceof Error ? error.message : String(error)
    });
  } finally {
    session.endSession();
  }
};

/**
 * Delete all records from multiple tables (kept for backward compatibility)
 */
export const deleteAllData = async (req: Request, res: Response) => {
  const { confirmationCode } = req.body;
  
  // Simple validation to prevent accidental deletion
  if (!confirmationCode || confirmationCode !== CONFIRMATION_CODE) {
    return res.status(400).json({
      success: false,
      message: "Invalid confirmation code. Data deletion aborted."
    });
  }
  
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    // Delete records from all tables
    const results = await Promise.all([
      LineItem.deleteMany({}).session(session),
      Transaction.deleteMany({}).session(session),
      Dates.deleteMany({}).session(session)
      // Add other models as needed
    ]);
    
    await session.commitTransaction();
    
    // Calculate total deleted records
    const totalDeleted = results.reduce((sum, result) => sum + result.deletedCount, 0);
    
    return res.status(200).json({ 
      success: true,
      message: `All data has been deleted successfully. ${totalDeleted} records were removed.`,
      deletedCount: totalDeleted
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Batch delete error:", error);
    
    return res.status(500).json({
      success: false,
      message: "Failed to delete data",
      error: error instanceof Error ? error.message : String(error)
    });
  } finally {
    session.endSession();
  }
};