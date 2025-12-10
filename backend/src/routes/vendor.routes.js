import express from 'express';
import {
	createVendor,
	getAllVendors,
	getVendorById,
	updateVendor,
	deleteVendor,
	searchVendors
} from '../controllers/vendor.controllers.js';

const router = express.Router();

// Vendor CRUD
router.get('/', getAllVendors);               // Get all vendors
router.post('/', createVendor);               // Create vendor
router.get('/search', searchVendors);         // Search vendors
router.get('/:id', getVendorById);            // Get vendor by ID
router.put('/:id', updateVendor);             // Update vendor
router.delete('/:id', deleteVendor);          // Delete vendor

export default router;
