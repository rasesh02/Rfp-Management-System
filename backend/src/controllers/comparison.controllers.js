import * as proposalModel from '../models/proposal.model.js';
import * as rfpModel from '../models/rfp.models.js';
import { client } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

// Compare multiple proposals for an RFP
export async function compareProposals(req, res) {
	try {
		const { rfpId } = req.params;
		const { proposal_ids } = req.body;

		// Validate RFP exists
		const rfp = await rfpModel.getById(rfpId);
		if (!rfp) {
			return res.status(404).json({ success: false, message: 'RFP not found' });
		}

		// Get proposals to compare
		let proposals;
		if (proposal_ids && Array.isArray(proposal_ids) && proposal_ids.length > 0) {
			proposals = await Promise.all(proposal_ids.map(id => proposalModel.getFullDetails(id)));
			proposals = proposals.filter(p => p && p.rfp_id === rfpId);
		} else {
			proposals = await proposalModel.getParsedProposalsByRfpId(rfpId);
		}

		if (proposals.length === 0) {
			return res.status(400).json({ success: false, message: 'No parsed proposals to compare' });
		}

		// Build comparison summary
		const comparison = {
			rfp_id: rfpId,
			rfp_title: rfp.title,
			proposals_count: proposals.length,
			comparison_at: new Date(),
			proposals: proposals.map(p => ({
				id: p.id,
				vendor_name: p.vendor_name,
				vendor_email: p.vendor_email,
				score: p.score,
				recommendation: p.recommendation_reason,
				parsed: p.parsed ? 'parsed' : 'not_parsed',
				received_at: p.received_at
			})),
			ranked: proposals
				.filter(p => p.score !== null)
				.sort((a, b) => (b.score || 0) - (a.score || 0))
				.map((p, idx) => ({
					rank: idx + 1,
					vendor_name: p.vendor_name,
					vendor_email: p.vendor_email,
					score: p.score,
					recommendation: p.recommendation_reason
				}))
		};

		return res.status(200).json({ success: true, data: comparison });
	} catch (err) {
		console.error('compareProposals error:', err);
		return res.status(500).json({ success: false, message: err.message });
	}
}

// Get AI-assisted evaluation for an RFP
export async function getEvaluation(req, res) {
	try {
		const { rfpId } = req.params;

		const rfp = await rfpModel.getById(rfpId);
		if (!rfp) {
			return res.status(404).json({ success: false, message: 'RFP not found' });
		}

		const proposals = await proposalModel.getParsedProposalsByRfpId(rfpId);
		if (proposals.length === 0) {
			return res.status(400).json({ success: false, message: 'No proposals available for evaluation' });
		}

		// Build evaluation summary
		const evaluation = {
			rfp_id: rfpId,
			rfp_title: rfp.title,
			evaluation_date: new Date(),
			total_proposals: proposals.length,
			summary: {
				best_overall: proposals[0] || null,
				best_cost: proposals.reduce((best, p) => {
					// Assuming lower cost is better, parsed.budget
					if (!best) return p;
					const bestBudget = best.parsed?.budget || Infinity;
					const pBudget = p.parsed?.budget || Infinity;
					return pBudget < bestBudget ? p : best;
				}),
				best_timeline: proposals.reduce((best, p) => {
					// Assuming shorter timeline is better
					if (!best) return p;
					const bestDays = best.parsed?.timeline?.project_duration ? parseInt(best.parsed.timeline.project_duration) : Infinity;
					const pDays = p.parsed?.timeline?.project_duration ? parseInt(p.parsed.timeline.project_duration) : Infinity;
					return pDays < bestDays ? p : best;
				})
			},
			all_proposals: proposals.map(p => ({
				id: p.id,
				vendor_name: p.vendor_name,
				vendor_email: p.vendor_email,
				score: p.score,
				recommendation: p.recommendation_reason,
				cost: p.parsed?.budget,
				timeline: p.parsed?.timeline?.project_duration,
				quality: p.parsed?.quality,
				compliance: p.parsed?.compliance,
				received_at: p.received_at
			}))
		};

		return res.status(200).json({ success: true, data: evaluation });
	} catch (err) {
		console.error('getEvaluation error:', err);
		return res.status(500).json({ success: false, message: err.message });
	}
}

// Save comparison run to database
export async function saveComparison(req, res) {
	try {
		const { rfpId } = req.params;
		const { results, config } = req.body;

		const rfp = await rfpModel.getById(rfpId);
		if (!rfp) {
			return res.status(404).json({ success: false, message: 'RFP not found' });
		}

		const comparisonId = uuidv4();
		const sql = `
			INSERT INTO comparison_runs (id, rfp_id, config, results, created_at)
			VALUES ($1, $2, $3, $4, now())
			RETURNING *;
		`;
		const res_db = await client.query(sql, [
			comparisonId,
			rfpId,
			config ? JSON.stringify(config) : null,
			results ? JSON.stringify(results) : null
		]);

		return res.status(201).json({ success: true, data: res_db.rows[0] });
	} catch (err) {
		console.error('saveComparison error:', err);
		return res.status(500).json({ success: false, message: err.message });
	}
}

// Get all comparisons for an RFP
export async function getComparisons(req, res) {
	try {
		const { rfpId } = req.params;
		const sql = `
			SELECT * FROM comparison_runs
			WHERE rfp_id = $1
			ORDER BY created_at DESC;
		`;
		const result = await client.query(sql, [rfpId]);
		return res.status(200).json({ success: true, data: result.rows, count: result.rows.length });
	} catch (err) {
		console.error('getComparisons error:', err);
		return res.status(500).json({ success: false, message: err.message });
	}
}

// Get a specific comparison run
export async function getComparisonById(req, res) {
	try {
		const { comparisonId } = req.params;
		const sql = `SELECT * FROM comparison_runs WHERE id = $1;`;
		const result = await client.query(sql, [comparisonId]);
		if (result.rows.length === 0) {
			return res.status(404).json({ success: false, message: 'Comparison not found' });
		}
		return res.status(200).json({ success: true, data: result.rows[0] });
	} catch (err) {
		console.error('getComparisonById error:', err);
		return res.status(500).json({ success: false, message: err.message });
	}
}
