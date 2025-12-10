//*1
import db from '../models/index.js';
import { computeScoresForRfp } from './scoring.service.js';

// called by parse worker
export async function saveParsedProposal({ rawEmail, parsed }) {
  // find or create vendor
  const vendor = await db.Vendor.findOrCreate({ where: { contact_email: rawEmail.from_email }, defaults: { name: parsed.vendorName || rawEmail.from_email }});
  const vendorId = vendor[0].id;

  // create proposal record
  const [proposal] = await db.Proposal.findOrCreate({
    where: { rawEmailId: rawEmail.id },
    defaults: {
      rfpId: rawEmail.rfpId,
      vendorId,
      rawEmailId: rawEmail.id,
      parsed,
      status: 'PARSED'
    }
  });

  // if already exists, update
  if (!proposal.isNewRecord) {
    proposal.parsed = parsed;
    proposal.status = 'PARSED';
    await proposal.save();
  }

  // fetch all proposals for this RFP and compute scores
  const proposals = await db.Proposal.findAll({ where: { rfpId: rawEmail.rfpId }});
  const computed = computeScoresForRfp(rawEmail.rfpId, proposals.map(p => {
    return { id: p.id, parsed: p.parsed, vendor_id: p.vendorId, vendorId: p.vendorId };
  }));

  // save scores back to DB per proposal
  for (const c of computed) {
    await db.Proposal.update({ scores: c.scores, totalScore: c.totalScore, status: 'SCORED' }, { where: { id: c.proposalId }});
  }

  return proposal;
}
