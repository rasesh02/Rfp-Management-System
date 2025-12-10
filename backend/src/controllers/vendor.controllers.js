import * as vendorModel from '../models/vendor.model.js';

// Create vendor
export async function createVendor(req, res) {
	try {
		const { name, contact_email, contact_person, contact_phone, metadata } = req.body;
		if (!name || !contact_email) {
			return res.status(400).json({ success: false, message: 'name and contact_email required' });
		}
		const vendor = await vendorModel.create({ name, contact_email, contact_person, contact_phone, metadata });
		return res.status(201).json({ success: true, data: vendor });
	} catch (err) {
		console.error('createVendor error:', err);
		return res.status(500).json({ success: false, message: err.message });
	}
}

// Get all vendors
export async function getAllVendors(req, res) {
	try {
		const vendors = await vendorModel.getAll();
		return res.status(200).json({ success: true, data: vendors, count: vendors.length });
	} catch (err) {
		console.error('getAllVendors error:', err);
		return res.status(500).json({ success: false, message: err.message });
	}
}

// Get vendor by ID
export async function getVendorById(req, res) {
	try {
		const { id } = req.params;
		const vendor = await vendorModel.getById(id);
		if (!vendor) {
			return res.status(404).json({ success: false, message: 'Vendor not found' });
		}
		return res.status(200).json({ success: true, data: vendor });
	} catch (err) {
		console.error('getVendorById error:', err);
		return res.status(500).json({ success: false, message: err.message });
	}
}

// Update vendor
export async function updateVendor(req, res) {
	try {
		const { id } = req.params;
		const { name, contact_email, contact_person, contact_phone, metadata } = req.body;
		const vendor = await vendorModel.update(id, { name, contact_email, contact_person, contact_phone, metadata });
		if (!vendor) {
			return res.status(404).json({ success: false, message: 'Vendor not found' });
		}
		return res.status(200).json({ success: true, data: vendor });
	} catch (err) {
		console.error('updateVendor error:', err);
		return res.status(500).json({ success: false, message: err.message });
	}
}

// Delete vendor
export async function deleteVendor(req, res) {
	try {
		const { id } = req.params;
		const deleted = await vendorModel.deleteVendor(id);
		if (!deleted) {
			return res.status(404).json({ success: false, message: 'Vendor not found' });
		}
		return res.status(200).json({ success: true, message: 'Vendor deleted' });
	} catch (err) {
		console.error('deleteVendor error:', err);
		return res.status(500).json({ success: false, message: err.message });
	}
}

// Search vendors
export async function searchVendors(req, res) {
	try {
		const { q } = req.query;
		if (!q || q.trim().length === 0) {
			return res.status(400).json({ success: false, message: 'Search query required' });
		}
		const vendors = await vendorModel.search(q);
		return res.status(200).json({ success: true, data: vendors, count: vendors.length });
	} catch (err) {
		console.error('searchVendors error:', err);
		return res.status(500).json({ success: false, message: err.message });
	}
}
