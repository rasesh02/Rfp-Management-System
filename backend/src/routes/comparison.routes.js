import express from 'express';
import {
	compareProposals,
	getEvaluation,
	saveComparison,
	getComparisons,
	getComparisonById
} from '../controllers/comparison.controllers.js';

const router = express.Router();

// Comparison endpoints
router.post('/:rfpId/compare', compareProposals);              // Compare proposals for an RFP
router.get('/:rfpId/evaluation', getEvaluation);               // Get AI-assisted evaluation
router.post('/:rfpId/comparison/save', saveComparison);        // Save comparison results
router.get('/:rfpId/comparisons', getComparisons);             // Get all comparisons for RFP
router.get('/comparisons/:comparisonId', getComparisonById);   // Get specific comparison

export default router;
