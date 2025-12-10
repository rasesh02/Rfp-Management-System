import { client } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

// Get vendor by ID
export async function getById(id) {
	const res = await client.query('SELECT * FROM vendors WHERE id = $1', [id]);
	return res.rows[0] || null;
}

// Get all vendors
export async function getAll() {
	const res = await client.query('SELECT * FROM vendors ORDER BY created_at DESC');
	return res.rows;
}

// Create vendor
export async function create({ name, contact_email, contact_person, contact_phone, metadata = {} }) {
	if (!name || !contact_email) throw new Error('name and contact_email required');
	const id = uuidv4();
	const sql = `
		INSERT INTO vendors (id, name, contact_email, contact_person, contact_phone, metadata, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, now())
		RETURNING *;
	`;
	const res = await client.query(sql, [
		id,
		name,
		contact_email,
		contact_person || null,
		contact_phone || null,
		metadata ? JSON.stringify(metadata) : null
	]);
	return res.rows[0];
}

// Update vendor
export async function update(id, { name, contact_email, contact_person, contact_phone, metadata } = {}) {
	if (!id) throw new Error('Vendor id required');
	const updates = [];
	const params = [];

	if (name !== undefined) {
		params.push(name);
		updates.push(`name = $${params.length}`);
	}
	if (contact_email !== undefined) {
		params.push(contact_email);
		updates.push(`contact_email = $${params.length}`);
	}
	if (contact_person !== undefined) {
		params.push(contact_person);
		updates.push(`contact_person = $${params.length}`);
	}
	if (contact_phone !== undefined) {
		params.push(contact_phone);
		updates.push(`contact_phone = $${params.length}`);
	}
	if (metadata !== undefined) {
		params.push(JSON.stringify(metadata));
		updates.push(`metadata = $${params.length}`);
	}

	if (updates.length === 0) return await getById(id);

	params.push(id);
	const sql = `UPDATE vendors SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`;
	const res = await client.query(sql, params);
	return res.rows[0] || null;
}

// Delete vendor
export async function deleteVendor(id) {
	if (!id) throw new Error('Vendor id required');
	const sql = 'DELETE FROM vendors WHERE id = $1 RETURNING id';
	const res = await client.query(sql, [id]);
	return res.rowCount > 0;
}

// Search vendors by name or email
export async function search(query) {
	const searchTerm = `%${query}%`;
	const sql = `
		SELECT * FROM vendors
		WHERE name ILIKE $1 OR contact_email ILIKE $1 OR contact_person ILIKE $1
		ORDER BY created_at DESC
		LIMIT 50;
	`;
	const res = await client.query(sql, [searchTerm]);
	return res.rows;
}