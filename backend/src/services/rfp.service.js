import * as rfpModel from '../models/rfp.models.js'
import { v4 as uuidv4 } from 'uuid';
import { client } from '../config/db.js';
import { parseRfp as aiParseRfp } from './ai.service.js';
import {addJob} from '../jobs/emailQueue.js' 





export async function create({ title, description, structured, created_by = null }) {
  const created = await rfpModel.create({ title, description, structured, created_by });
  return created;
}

export async function createFromNL({nl,meta={},created_by=null}){
  const parsed= await aiParseRfp(nl,meta);
  const title=parsed.metadata.project_title;
  const description=nl;
  const created= await rfpModel.create({ title, description, structured: parsed, created_by });
  return created;
}

export async function sendToVendors(rfpId, { vendorIds = [], emailTemplateId = null, message = null, requestedBy = null } = {}){
   const rfp=await rfpModel.getById(rfpId);
   if(!rfp) return res.status(404).json({error: "rfpid not found"});
   if(!Array.isArray(vendorIds) ||  vendorIds.length === 0){
    return res.status(400).json({error:"vendor ids not present"});
   }
   //rfp plus vendors
   const rv=await rfpModel.bulkCreateRfpVendors(rfpId,vendorIds);
   console.log("entry added to rfp_vendors db");
   const jobs=[];
   for(let rvi of rv){
      const data={
        rfpId,
        rfp,
        vendorId:rvi.vendor_id,
        rfpVendorId: rvi.id,
          emailTemplateId,
        message,
       requestedBy
      }
      const job_id=`Send-rfp-${rvi.id}`;
      jobs.push(addJob(job_id,data));
      console.log(job_id);
   }
   try {
  // The function pauses here until all jobs finish
  await Promise.all(jobs);

  // This only runs if EVERY job in Promise.all succeeded
  return {
    enqueued: rv.length,
    links: rv.map(r => ({ id: r.id, vendor_id: r.vendor_id }))
  };
} catch (error) {
  // This runs if ANY job failed
  console.error("One or more jobs failed:", error);
  // You can decide to return a partial success or throw the error upward
  throw error; 
}
} 