import * as rfpService from '../services/rfp.service.js';
import * as rfpModel from '../models/rfp.models.js';

export async function createRfp(req,res){
   try {
      const { nl_description, title, description, structured }=req.body;
      if(!nl_description && !(title || description || structured)){
        return res.status(400).json({success: false, message: 'Provide nl_description or title/description/structured' })
      }
     let created;
     if(nl_description){
       created=await rfpService.createFromNL({ nl: nl_description, meta: req.body.meta || {} });
     }
     else {
      created = await rfpService.create({ title, description, structured });
    }
    return res.status(201).json({ success: true, data: created });
   } catch (error) {
      console.error('createRfp error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
   }
} 

export async function sendRfp(req, res) {
   try {
    const { id } = req.params;
    const { vendorIds, emailTemplateId, message } = req.body;
     if (!id) return res.status(400).json({ success: false, message: 'Missing rfp id' });
       if (!Array.isArray(vendorIds) || vendorIds.length === 0) {
      return res.status(400).json({ success: false, message: 'vendorIds array required' });
    }
    const result = await rfpService.sendToVendors(id, { vendorIds, emailTemplateId, message, requestedBy: req.user?.id || null });
    return res.status(201).json({ success: true, data: result, message: 'Send jobs enqueued' });
   } catch (err) {
    console.error('sendRfp error:', err);
    return res.status(500).json({ success: false, message: err.message });
   }
}

// Get all RFPs
export async function getAllRfps(req, res) {
   try {
      const { limit = 100, offset = 0, status } = req.query;
      let rfps;
      if (status) {
         rfps = await rfpModel.getAllByStatus(status, { limit: parseInt(limit), offset: parseInt(offset) });
      } else {
         rfps = await rfpModel.getAll({ limit: parseInt(limit), offset: parseInt(offset) });
      }
      return res.status(200).json({ success: true, data: rfps, count: rfps.length });
   } catch (err) {
      console.error('getAllRfps error:', err);
      return res.status(500).json({ success: false, message: err.message });
   }
}

// Get RFP by ID
export async function getRfpById(req, res) {
   try {
      const { id } = req.params;
      const rfp = await rfpModel.getById(id);
      if (!rfp) {
         return res.status(404).json({ success: false, message: 'RFP not found' });
      }
      return res.status(200).json({ success: true, data: rfp });
   } catch (err) {
      console.error('getRfpById error:', err);
      return res.status(500).json({ success: false, message: err.message });
   }
}

// Update RFP
export async function updateRfp(req, res) {
   try {
      const { id } = req.params;
      const { title, description, structured, status } = req.body;
      const rfp = await rfpModel.update(id, { title, description, structured, status });
      if (!rfp) {
         return res.status(404).json({ success: false, message: 'RFP not found' });
      }
      return res.status(200).json({ success: true, data: rfp });
   } catch (err) {
      console.error('updateRfp error:', err);
      return res.status(500).json({ success: false, message: err.message });
   }
}

// Delete RFP
export async function deleteRfp(req, res) {
   try {
      const { id } = req.params;
      const deleted = await rfpModel.deleteRfp(id);
      if (!deleted) {
         return res.status(404).json({ success: false, message: 'RFP not found' });
      }
      return res.status(200).json({ success: true, message: 'RFP deleted' });
   } catch (err) {
      console.error('deleteRfp error:', err);
      return res.status(500).json({ success: false, message: err.message });
   }
}