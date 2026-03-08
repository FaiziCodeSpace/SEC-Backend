import express from "express";
import {
    createLead,
    getLeads,
    getLeadById,
    editLead,
    deleteLead
} from "../controllers/Leads.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// General routes
router.get('/', protect, getLeads);
router.post('/createLead', protect, createLead);
 
// ID specific routes
router.get('/:id', protect, getLeadById);
router.patch('/editLead/:id', protect, editLead); 
router.delete('/deleteLead/:id', protect, deleteLead); 

export default router;