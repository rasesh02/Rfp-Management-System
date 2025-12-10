import express from 'express';
import {
	getProposalById,
	getProposalsByRfp,
	getParsedProposals,
	getProposalStatus,
	rescoreProposal
} from '../controllers/proposal.controllers.js';

const router = express.Router();

// Proposal retrieval
router.get('/:id', getProposalById);                    // Get proposal by ID
router.get('/rfp/:rfpId/all', getProposalsByRfp);       // Get all proposals for RFP
router.get('/rfp/:rfpId/parsed', getParsedProposals);   // Get parsed proposals for RFP
router.get('/rfp/:rfpId/status', getProposalStatus);    // Get proposal status for RFP

// Proposal operations
router.post('/:proposalId/rescore', rescoreProposal);   // Rescore proposal

export default router;
