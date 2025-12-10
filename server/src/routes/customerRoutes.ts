// src/routes/customerRoutes.ts
import { Router } from "express";
import { 
  getCustomers,
  getCustomerSummaries, 
  getCustomerById, 
  getCustomerByNameAndBdate, 
  getCustomerByNameAndPhone,
  getCustomerByReferenceNo,
  deleteCustomer, 
  updateCustomer, 
  deleteAllCustomers,
  getArchivedCustomers,
  updateCustomerCredibility
} from "../controllers/customerController";

const router = Router();

router.get("/", getCustomers);
router.get("/archived", getArchivedCustomers);
router.get("/summary", getCustomerSummaries);
router.get("/search/by-name-birthday", getCustomerByNameAndBdate);
router.get("/search/by-name-phone", getCustomerByNameAndPhone);
router.get("/search/by-reference", getCustomerByReferenceNo);
router.get("/:cust_id", getCustomerById);
router.put("/:cust_id/credibility", updateCustomerCredibility);
router.put("/:cust_id", updateCustomer);
router.delete("/:cust_id", deleteCustomer);

// Delete all customers
router.delete("/", deleteAllCustomers);

export default router;
