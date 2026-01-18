import {client} from '../db/connectPostgres.js'
import {v4 as uuidv4} from 'uuid'

export async function create({ title, description, structured, status = 'draft', created_by = null }){
    const id=uuidv4();
    const q=`INSERT INTO rfps(id, title, description, structured, status, created_by, created_at, updated_at)
             VALUES ($1,$2,$3,$4,$5,$6, now(), now())
             RETURNING *;`
    const values = [
    id,
    title || null,
    description || null,
    structured ? JSON.stringify(structured) : null,
    status,
    created_by
  ];
  const res = await client.query(q, values);
 // console.log(res);
  return res.rows[0];

}

export async function getById(id){
    const res=await client.query(`Select * from rfps where id=$1`,[id]);
    return res.rows[0];
}

// Get all RFPs
export async function getAll(options = {}) {
  const { limit = 100, offset = 0 } = options;
  const sql = `
    SELECT * FROM rfps
    ORDER BY created_at DESC
    LIMIT $1 OFFSET $2;
  `;
  const res = await client.query(sql, [limit, offset]);
  return res.rows;
}

// Get RFPs by status
export async function getAllByStatus(status, options = {}) {
  const { limit = 100, offset = 0 } = options;
  const sql = `
    SELECT * FROM rfps
    WHERE status = $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3;
  `;
  const res = await client.query(sql, [status, limit, offset]);
  return res.rows;
}

// Update RFP
export async function update(id, { title, description, structured, status } = {}) {
  if (!id) throw new Error('RFP id required');
  const updates = [];
  const params = [];

  if (title !== undefined) {
    params.push(title);
    updates.push(`title = $${params.length}`);
  }
  if (description !== undefined) {
    params.push(description);
    updates.push(`description = $${params.length}`);
  }
  if (structured !== undefined) {
    params.push(structured ? JSON.stringify(structured) : null);
    updates.push(`structured = $${params.length}`);
  }
  if (status !== undefined) {
    params.push(status);
    updates.push(`status = $${params.length}`);
  }

  if (updates.length === 0) return await getById(id);

  params.push(id);
  const sql = `UPDATE rfps SET ${updates.join(', ')}, updated_at = now() WHERE id = $${params.length} RETURNING *`;
  const res = await client.query(sql, params);
  return res.rows[0] || null;
}

// Delete RFP
export async function deleteRfp(id) {
  if (!id) throw new Error('RFP id required');
  const sql = 'DELETE FROM rfps WHERE id = $1 RETURNING id';
  const res = await client.query(sql, [id]);
  return res.rowCount > 0;
}

export async function remove(id){
    const res=await client.query(`DELETE from rfps where id= $1 RETURNING id`,[id]);
    return res.rowCount > 0;
}

export async function bulkCreateRfpVendors(rfpId, vendorIds = []){
    if (!vendorIds || vendorIds.length === 0) return [];

  // Build a multi-row insert
  const values = [];
  const placeholders = vendorIds.map((vendorId, idx) => {
    const base = idx * 4;
    const id = uuidv4();
    values.push(id, rfpId, vendorId, null); // email_message_id null initially
    return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, 'not_sent', now())`;
  });

  const q = `
    INSERT INTO rfp_vendors (id, rfp_id, vendor_id, email_message_id, status, created_at)
    VALUES ${placeholders.join(', ')}
    RETURNING *;
  `;
  const res = await client.query(q, values);
  return res.rows;
}


export async function updateRfpVendor(id, fields = {}) {
  if (!id) throw new Error('updateRfpVendor requires id');
  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) {
    throw new Error('updateRfpVendor requires fields object');
  }

  // whitelist of allowed columns to update
  const allowed = ['email_message_id', 'sent_at', 'status'];
  const keys = Object.keys(fields).filter(k => allowed.includes(k));

  if (keys.length === 0) {
    throw new Error(`updateRfpVendor: no valid fields provided. Allowed: ${allowed.join(', ')}`);
  }

  const setClauses = [];
  const params = [];

  keys.forEach((key) => {
    params.push(fields[key]);
    setClauses.push(`${key} = $${params.length}`);
  });

  // add WHERE param
  params.push(id);
  const sql = `
    UPDATE rfp_vendors
    SET ${setClauses.join(', ')}
    WHERE id = $${params.length}
    RETURNING *;
  `;

  const res = await client.query(sql, params);
  return res.rowCount > 0 ? res.rows[0] : null;
}