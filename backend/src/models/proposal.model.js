import { client } from '../config/db.js';

// Get proposal by ID
export async function getById(id) {
	const sql = `SELECT * FROM proposals WHERE id = $1`;
	const res = await client.query(sql, [id]);
	return res.rows[0] || null;
}

// Get all proposals for an RFP
export async function getByRfpId(rfpId, options = {}) {
	const { limit = 100, offset = 0 } = options;
	const sql = `
		SELECT 
			p.*,
			v.name as vendor_name,
			v.contact_email as vendor_email
		FROM proposals p
		LEFT JOIN vendors v ON p.vendor_id = v.id
		WHERE p.rfp_id = $1
		ORDER BY p.received_at DESC
		LIMIT $2 OFFSET $3;
	`;
	const res = await client.query(sql, [rfpId, limit, offset]);
	return res.rows;
}

// Get proposal count for an RFP
export async function countByRfpId(rfpId) {
	const sql = `SELECT COUNT(*) as count FROM proposals WHERE rfp_id = $1`;
	const res = await client.query(sql, [rfpId]);
	return parseInt(res.rows[0].count, 10);
}

// Get proposals by vendor
export async function getByVendorId(vendorId, options = {}) {
	const { limit = 100, offset = 0 } = options;
	const sql = `
		SELECT p.* FROM proposals p
		WHERE p.vendor_id = $1
		ORDER BY p.received_at DESC
		LIMIT $2 OFFSET $3;
	`;
	const res = await client.query(sql, [vendorId, limit, offset]);
	return res.rows;
}

// Get proposals with parsed data (ready for comparison)
export async function getParsedProposalsByRfpId(rfpId) {
	const sql = `
		SELECT 
			p.id,
			p.rfp_id,
			p.vendor_id,
			p.parsed,
			p.score,
			p.recommendation_reason,
			v.name as vendor_name,
			v.contact_email as vendor_email,
			p.received_at
		FROM proposals p
		LEFT JOIN vendors v ON p.vendor_id = v.id
		WHERE p.rfp_id = $1 AND p.parsed IS NOT NULL
		ORDER BY p.score DESC NULLS LAST, p.received_at DESC;
	`;
	const res = await client.query(sql, [rfpId]);
	return res.rows;
}

// Update proposal
export async function update(id, { parsed, score, recommendation_reason } = {}) {
	if (!id) throw new Error('Proposal id required');
	const updates = [];
	const params = [];

	if (parsed !== undefined) {
		params.push(parsed ? JSON.stringify(parsed) : null);
		updates.push(`parsed = $${params.length}`);
	}
	if (score !== undefined) {
		params.push(score);
		updates.push(`score = $${params.length}`);
	}
	if (recommendation_reason !== undefined) {
		params.push(recommendation_reason);
		updates.push(`recommendation_reason = $${params.length}`);
	}

	if (updates.length === 0) return await getById(id);

	params.push(id);
	const sql = `UPDATE proposals SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`;
	const res = await client.query(sql, params);
	return res.rows[0] || null;
}

// Get proposal with full details for evaluation
export async function getFullDetails(proposalId) {
	const sql = `
		SELECT 
			p.*,
			v.id as vendor_id,
			v.name as vendor_name,
			v.contact_email as vendor_email,
			v.contact_person,
			v.contact_phone,
			r.id as rfp_id,
			r.title as rfp_title,
			r.structured as rfp_structured
		FROM proposals p
		LEFT JOIN vendors v ON p.vendor_id = v.id
		LEFT JOIN rfps r ON p.rfp_id = r.id
		WHERE p.id = $1;
	`;
	const res = await client.query(sql, [proposalId]);
	return res.rows[0] || null;
}
