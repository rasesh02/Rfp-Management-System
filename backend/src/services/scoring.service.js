// Example scoring system
const DEFAULT_WEIGHTS = {
    cost: 0.25,
    timeline: 0.15,
    quality: 0.15,
    support: 0.10,
    reliability: 0.10,
    compliance: 0.10,
    business: 0.15
  };
  
  // normalization helpers
  function normalizeLowerIsBetter(value, min, max) {
    if (value == null) return 0.5; // missing => neutral
    if (min === max) return 1;
    const clipped = Math.max(min, Math.min(max, value));
    return 1 - (clipped - min) / (max - min); // lower better => higher normalized
  }
  function normalizeHigherIsBetter(value, min, max) {
    if (value == null) return 0.5;
    if (min === max) return 1;
    const clipped = Math.max(min, Math.min(max, value));
    return (clipped - min) / (max - min);
  }
  
  // compute scores for all proposals for that RFP
  export function computeScoresForRfp(rfpId, proposals, weights = DEFAULT_WEIGHTS) {
    // collect min/max per raw metric across proposals
    const stats = {
      cost: { min: Infinity, max: -Infinity },
      timeline_days: { min: Infinity, max: -Infinity },
      defectRate: { min: Infinity, max: -Infinity },
      returnRate: { min: Infinity, max: -Infinity },
      failureRate: { min: Infinity, max: -Infinity },
      yearsInOperation: { min: Infinity, max: -Infinity },
      clientRetentionRate: { min: Infinity, max: -Infinity }
    };
    for (const p of proposals) {
      const s = p.parsed || {};
      if (s.cost != null) { stats.cost.min = Math.min(stats.cost.min, s.cost); stats.cost.max = Math.max(stats.cost.max, s.cost); }
      if (s.timeline_days != null) { stats.timeline_days.min = Math.min(stats.timeline_days.min, s.timeline_days); stats.timeline_days.max = Math.max(stats.timeline_days.max, s.timeline_days); }
      if (s.quality) {
        if (s.quality.defectRate != null) { stats.defectRate.min = Math.min(stats.defectRate.min, s.quality.defectRate); stats.defectRate.max = Math.max(stats.defectRate.max, s.quality.defectRate); }
        if (s.quality.returnRate != null) { stats.returnRate.min = Math.min(stats.returnRate.min, s.quality.returnRate); stats.returnRate.max = Math.max(stats.returnRate.max, s.quality.returnRate); }
      }
      if (s.reliability && s.reliability.failureRate != null) { stats.failureRate.min = Math.min(stats.failureRate.min, s.reliability.failureRate); stats.failureRate.max = Math.max(stats.failureRate.max, s.reliability.failureRate); }
      if (s.business) {
        if (s.business.yearsInOperation != null) { stats.yearsInOperation.min = Math.min(stats.yearsInOperation.min, s.business.yearsInOperation); stats.yearsInOperation.max = Math.max(stats.yearsInOperation.max, s.business.yearsInOperation); }
        if (s.business.clientRetentionRate != null) { stats.clientRetentionRate.min = Math.min(stats.clientRetentionRate.min, s.business.clientRetentionRate); stats.clientRetentionRate.max = Math.max(stats.clientRetentionRate.max, s.business.clientRetentionRate); }
      }
    }
  
    // replace infinities with sensible defaults
    for (const k of Object.keys(stats)) {
      if (stats[k].min === Infinity) stats[k].min = 0;
      if (stats[k].max === -Infinity) stats[k].max = stats[k].min === 0 ? 1 : stats[k].min;
    }
  
    const results = [];
    for (const p of proposals) {
      const s = p.parsed || {};
      const costScore = normalizeLowerIsBetter(s.cost, stats.cost.min, stats.cost.max);
      const timelineScore = normalizeLowerIsBetter(s.timeline_days, stats.timeline_days.min, stats.timeline_days.max);
  
      // quality: combine defectRate & returnRate -> lower is better
      const defect = s.quality?.defectRate ?? null;
      const ret = s.quality?.returnRate ?? null;
      const defectScore = normalizeLowerIsBetter(defect, stats.defectRate.min, stats.defectRate.max);
      const returnScore = normalizeLowerIsBetter(ret, stats.returnRate.min, stats.returnRate.max);
      const qualityScore = (defectScore + returnScore) / 2;
  
      const supportScore = s.support && s.support.slaRespHours != null ? normalizeLowerIsBetter(s.support.slaRespHours, 0, Math.max(1, stats.timeline_days.max)) : 0.5;
      const reliabilityScore = s.reliability && s.reliability.failureRate != null ? normalizeLowerIsBetter(s.reliability.failureRate, stats.failureRate.min, stats.failureRate.max) : 0.5;
  
      // compliance: boolean flags -> simple score (1 = fully compliant, 0 = non-compliant)
      const complianceScore = computeComplianceScore(s.compliance);
  
      // business stability: years (higher better) and retention rate (higher better)
      const yearsScore = normalizeHigherIsBetter(s.business?.yearsInOperation ?? null, stats.yearsInOperation.min, stats.yearsInOperation.max);
      const retentionScore = normalizeHigherIsBetter(s.business?.clientRetentionRate ?? null, stats.clientRetentionRate.min, stats.clientRetentionRate.max);
      const businessScore = (yearsScore + retentionScore) / 2;
  
      // weighted total
      const groupScores = {
        cost: costScore, timeline: timelineScore, quality: qualityScore,
        support: supportScore, reliability: reliabilityScore, compliance: complianceScore, business: businessScore
      };
  
      let total = 0;
      for (const [k,v] of Object.entries(groupScores)) {
        total += (weights[k] || 0) * (v ?? 0.5);
      }
  
      results.push({
        proposalId: p.id,
        vendorId: p.vendor_id || p.vendorId,
        scores: groupScores,
        totalScore: total
      });
    }
  
    // Sort descending by total
    results.sort((a,b) => b.totalScore - a.totalScore);
    return results;
  }
  
  function computeComplianceScore(compliance) {
    if (!compliance) return 0.5;
    // example: count number of 'yes' flags
    const flags = Object.values(compliance).map(v => v ? 1 : 0);
    if (flags.length === 0) return 0.5;
    return flags.reduce((s,x)=>s+x,0)/flags.length;
  }
  