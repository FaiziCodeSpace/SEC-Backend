import express from "express";
import {
    createLead,
    getLeads,
    getLeadById,
    editLead,
    deleteLead
} from "../controllers/Leads.js";

const router = express.Router();

// General routes
router.get('/', getLeads);
router.post('/createLead', createLead);
 
// ID specific routes
router.get('/:id', getLeadById);
router.patch('/editLead/:id', editLead); 
router.delete('/deleteLead/:id', deleteLead); 

export default router;