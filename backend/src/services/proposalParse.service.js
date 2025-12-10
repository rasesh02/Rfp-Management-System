import { client } from '../config/db.js';
import { jsonifyProposalEmail, scoreVendorProposal } from './ai.service.js';

// Fetch proposal by ID from proposals table
export async function getProposalById(id) {
	const sql = `SELECT * FROM proposals WHERE id = $1 LIMIT 1`;
	const { rows } = await client.query(sql, [id]);
	if (!rows[0]) throw new Error(`Proposal not found: ${id}`);
	return rows[0];
}

// Fetch RFP by ID
export async function getRfpById(rfpId) {
	const sql = `SELECT * FROM rfps WHERE id = $1 LIMIT 1`;
	const { rows } = await client.query(sql, [rfpId]);
	if (!rows[0]) throw new Error(`RFP not found: ${rfpId}`);
	return rows[0];
}

// Save parsed proposal and trigger scoring
export async function saveParsedProposal({ proposalId }) {
	// 1. Fetch proposal and RFP
	const proposal = await getProposalById(proposalId);
	const rfp = await getRfpById(proposal.rfp_id);

	// 2. Parse proposal raw_email using AI
	let parsed;
	try {
		parsed = await jsonifyProposalEmail(proposal.raw_email);
		console.log("json parsed email",parsed)
	} catch (err) {
		console.error('AI parsing failed:', err);
		parsed = null;
	}

	// 3. Score proposal (compare to RFP requirements)
	let scores = { totalScore: 0, recommendation_reason: 'Unable to score' };
	if (parsed) {
		try {
			scores = await scoreVendorProposal({ parsedProposal: parsed, rfpStructured: rfp.structured });
		} catch (err) {
			console.error('AI scoring failed:', err);
			scores = { totalScore: 0, recommendation_reason: 'Failed to score: ' + (err.message || 'Unknown error') };
		}
	}

	// 4. Update proposal with parsed and scores
	const scoreValue = (scores && typeof scores.totalScore === 'number') ? scores.totalScore : 0;
	const recommendationText = (scores && scores.recommendation_reason) ? scores.recommendation_reason : 'No recommendation';
	await client.query(
		`UPDATE proposals SET parsed = $1, score = $2, recommendation_reason = $3 WHERE id = $4`,
		[parsed ? JSON.stringify(parsed) : null, scoreValue, recommendationText, proposalId]
	);

	return { parsed, scores };
}

// Scoring logic
export async function scoreProposalAgainstRfp(parsed, rfpStructured) {
	// 0. Requirement fulfillment
	let requirementsFulfilled = 0;
	let totalRequirements = 0;
	if (rfpStructured && rfpStructured.scope && rfpStructured.scope.technical_requirements) {
		totalRequirements = rfpStructured.scope.technical_requirements.length;
		if (parsed && parsed.scope && parsed.scope.technical_requirements) {
			requirementsFulfilled = parsed.scope.technical_requirements.filter(req => rfpStructured.scope.technical_requirements.includes(req)).length;
		}
	}
	const requirementsScore = totalRequirements ? (requirementsFulfilled / totalRequirements) * 100 : 0;

	// 1. Cost & Financial Metrics
	const costScore = parsed && parsed.budget ? Math.max(0, 100 - parsed.budget / 1000) : 0;

	// 2. Delivery & Timeline Metrics
	const deliveryScore = parsed && parsed.timeline && parsed.timeline.project_duration ? Math.min(100, 100 / (parseInt(parsed.timeline.project_duration) || 1)) : 0;

	// 3. Quality Metrics
	const defectRate = parsed && parsed.quality && parsed.quality.defectRate ? parsed.quality.defectRate : 0;
	const returnRate = parsed && parsed.quality && parsed.quality.returnRate ? parsed.quality.returnRate : 0;
	const qualityScore = 100 - ((defectRate + returnRate) / 2);

	// 4. Service & Support Metrics
	const supportScore = parsed && parsed.support ? Math.min(100, parsed.support.level * 10) : 0;

	// 5. Reliability & Consistency Metrics
	const failureRate = parsed && parsed.reliability && parsed.reliability.failureRate ? parsed.reliability.failureRate : 0;
	const reliabilityScore = 100 - failureRate;

	// 6. Compliance & Risk Metrics
	const complianceScore = parsed && parsed.compliance ? (parsed.compliance.passed ? 100 : 0) : 0;

	// 7. Business Stability Metrics
	const yearsInOperation = parsed && parsed.business && parsed.business.yearsInOperation ? parsed.business.yearsInOperation : 0;
	const clientRetentionRate = parsed && parsed.business && parsed.business.clientRetentionRate ? parsed.business.clientRetentionRate : 0;
	const businessStabilityScore = (yearsInOperation * 5) + clientRetentionRate;

	// Aggregate score
	const totalScore = (
		requirementsScore * 0.2 +
		costScore * 0.15 +
		deliveryScore * 0.15 +
		qualityScore * 0.15 +
		supportScore * 0.1 +
		reliabilityScore * 0.1 +
		complianceScore * 0.1 +
		businessStabilityScore * 0.05
	);

	// Recommendation reason (simple example)
	let recommendation = 'Meets most requirements.';
	if (totalScore > 80) recommendation = 'Highly recommended.';
	else if (totalScore > 60) recommendation = 'Recommended with reservations.';
	else recommendation = 'Not recommended.';

	return {
		requirementsScore,
		costScore,
		deliveryScore,
		qualityScore,
		supportScore,
		reliabilityScore,
		complianceScore,
		businessStabilityScore,
		totalScore,
		recommendation
	};
}
