import * as proposalModel from '../models/proposal.model.js';
import * as rfpModel from '../models/rfp.models.js';
import { client } from '../config/db.js';
import { scoreVendorProposal } from '../services/ai.service.js';

// Get proposal by ID
export async function getProposalById(req, res) {
	try {
		const { id } = req.params;
		const proposal = await proposalModel.getFullDetails(id);
		if (!proposal) {
			return res.status(404).json({ success: false, message: 'Proposal not found' });
		}
		return res.status(200).json({ success: true, data: proposal });
	} catch (err) {
		console.error('getProposalById error:', err);
		return res.status(500).json({ success: false, message: err.message });
	}
}

// Get all proposals for an RFP
export async function getProposalsByRfp(req, res) {
	try {
		const { rfpId } = req.params;
		const { limit = 100, offset = 0 } = req.query;
		const proposals = await proposalModel.getByRfpId(rfpId, { limit: parseInt(limit), offset: parseInt(offset) });
		const count = await proposalModel.countByRfpId(rfpId);
		return res.status(200).json({ success: true, data: proposals, count, total: count });
	} catch (err) {
		console.error('getProposalsByRfp error:', err);
		return res.status(500).json({ success: false, message: err.message });
	}
}

// Get parsed proposals for comparison
export async function getParsedProposals(req, res) {
	try {
		const { rfpId } = req.params;
		const proposals = await proposalModel.getParsedProposalsByRfpId(rfpId);
		if (proposals.length === 0) {
			return res.status(200).json({ success: true, data: [], message: 'No parsed proposals yet' });
		}
		return res.status(200).json({ success: true, data: proposals, count: proposals.length });
	} catch (err) {
		console.error('getParsedProposals error:', err);
		return res.status(500).json({ success: false, message: err.message });
	}
}

// Get proposal status (parsed, scored, etc)
export async function getProposalStatus(req, res) {
	try {
		const { rfpId } = req.params;
		const proposals = await proposalModel.getByRfpId(rfpId);
		const status = {
			total: proposals.length,
			received: proposals.filter(p => p.received_at).length,
			parsed: proposals.filter(p => p.parsed).length,
			scored: proposals.filter(p => p.score !== null).length,
			pending_parse: proposals.filter(p => !p.parsed).length,
			proposals: proposals.map(p => ({
				id: p.id,
				vendor_name: p.vendor_name,
				received_at: p.received_at,
				parsed: !!p.parsed,
				score: p.score,
				recommendation: p.recommendation_reason
			}))
		};
		return res.status(200).json({ success: true, data: status });
	} catch (err) {
		console.error('getProposalStatus error:', err);
		return res.status(500).json({ success: false, message: err.message });
	}
}

// Rescore a single proposal (manual re-evaluation)
export async function rescoreProposal(req, res) {
	try {
		const { proposalId } = req.params;
		const proposal = await proposalModel.getFullDetails(proposalId);
		if (!proposal) {
			return res.status(404).json({ success: false, message: 'Proposal not found' });
		}
		if (!proposal.parsed) {
			return res.status(400).json({ success: false, message: 'Proposal not yet parsed' });
		}

		const rfp = await rfpModel.getById(proposal.rfp_id);
		if (!rfp) {
			return res.status(404).json({ success: false, message: 'RFP not found' });
		}

		// Rescore using AI
		const scores = await scoreVendorProposal({ 
			parsedProposal: proposal.parsed, 
			rfpStructured: rfp.structured 
		});

		// Update proposal
		await proposalModel.update(proposalId, { 
			score: scores.totalScore, 
			recommendation_reason: scores.recommendation_reason 
		});

		return res.status(200).json({ success: true, data: { scores, proposal_id: proposalId } });
	} catch (err) {
		console.error('rescoreProposal error:', err);
		return res.status(500).json({ success: false, message: err.message });
	}
}
