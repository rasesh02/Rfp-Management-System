import express from 'express'
import { createRfp, sendRfp, getAllRfps, getRfpById, updateRfp, deleteRfp } from '../controllers/rfp.controllers.js'
const router = express.Router();

// RFP CRUD
router.get('/', getAllRfps);                   
router.post('/', createRfp);                   
router.get('/:id', getRfpById);                 // Get RFP by ID
router.put('/:id', updateRfp);                  // Update RFP
router.delete('/:id', deleteRfp);               // Delete RFP

// RFP Operations
router.post('/send/:id/', sendRfp);              // Send RFP to vendors

export default router;