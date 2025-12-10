import dotenv from 'dotenv';
dotenv.config({path:'./.env'});

import bullmq from "bullmq";
const { Worker } = bullmq;
import IORedis from "ioredis";

import connectPostgres, { client } from "../config/db.js";
import * as rfpModel from "../models/rfp.models.js";
import * as vendorModel from "../models/vendor.model.js";
import sendWithNodemailer from "../services/mailer.js"

// Connect to database before processing jobs
await connectPostgres();

const connection = new IORedis({ url: process.env.REDIS_URL || "redis://localhost:6379", maxRetriesPerRequest: null });
console.log("✅ Worker connected to Redis");

const worker = new Worker(
  "send-rfp-emails",
  async (job) => {
    console.log("📨 Processing job:", job.id);
    const {
      rfpId,
      rfp, // optional preloaded rfp
      vendorId,
      rfpVendorId,
      emailTemplateId,
      message,
      requestedBy,
    } = job.data;

    try {
      // fetch rfp if not provided
      const rfpData = rfp ?? (await rfpModel.getById(rfpId));
      if (!rfpData) throw new Error(`RFP not found ${rfpId}`);

      // fetch vendor
      const vendor = await vendorModel.getById(vendorId);
      if (!vendor) throw new Error(`Vendor not found ${vendorId}`);
      if (!vendor.contact_email) throw new Error(`Vendor ${vendorId} has no email`);

      // render template
      const templateVars = {
        rfp: rfpData,
        vendor,
        requestedBy,
        rfpVendorId,
      };

      // Use message or fallback template
      let emailData;
      if (message) {
        // If custom message provided, use it
        emailData = {
          subject: `RFP: ${rfpData.title || rfpId}`,
          html: message,
          text: message,
        };
      } else {
        // Default email template
        emailData = {
          subject: `Invitation to respond to RFP: ${rfpData.title || rfpId}`,
          html: `<p>Hello ${vendor.name || vendor.contact_person || ""},</p>
                 <p>Please review our RFP: <strong>${rfpData.title || rfpId}</strong>.</p>
                 <p>${rfpData.description || ""}</p>`,
          text: `Hello ${vendor.name || ""},\n\nPlease review the RFP: ${rfpData.title || rfpId}\n\n${rfpData.description || ""}`
        };
      }

      // send mail — pass rfpId so mailer adds X-RFP-ID and sets Message-ID
      const sendRes = await sendWithNodemailer({
        to: vendor.contact_email,
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
        rfpId // <- important to add X-RFP-ID automatically
      });

      console.log("✅ Email sent successfully to", vendor.contact_email, "messageId=", sendRes.messageId);

      //make the rf_vendors db update here
      try {
        const sentAt = new Date();
          await rfpModel.updateRfpVendor(rfpVendorId, {
            email_message_id: sendRes.messageId,
            sent_at: sentAt,
            status: "sent"
          });
          console.log(`✅ rfp_vendors updated via rfpModel.updateRfpVendor (id=${rfpVendorId})`);
      } catch (error) {
         console.error("❌ Failed to persist rfp_vendors update:", error && error.message ? error.message : error);
      }

      return { ok: true, messageId: sendRes.messageId, provider: sendRes.provider };
    } catch (err) {
      console.error("❌ Failed to send RFP email:", err.message || err);
      throw err;
    }
  },
  { connection }
);

worker.on("failed", (job, err) => {
  console.error(`❌ Job ${job.id} failed:`, err.message);
});

worker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed successfully`);
});

export default worker;

/*
import bullmq from "bullmq";
const { Worker } = bullmq;
import IORedis from "ioredis";

import * as rfpModel from "../models/rfp.models.js";
import * as vendorModel from "../models/vendor.model.js";
import sendWithNodemailer from "../services/mailer.js"

const connection = new IORedis({ url: "redis://localhost:6379", maxRetriesPerRequest: null });
console.log("worker connected");

const worker = new Worker(
  "send-rfp-emails",
  async (job) => {
    console.log("Picked job:", job.id);
    const {
      rfpId,
      rfp, // optional preloaded rfp
      vendorId,
      rfpVendorId,
      emailTemplateId,
      message,
      requestedBy,
    } = job.data;

    // optimistic update
    // try {
    //   await rfpVendorModel.updateStatus(rfpVendorId, "sending");
    // } catch (err) {
    //   logger.warn("Could not mark rfp_vendor sending (continuing):", err.message);
    // }

    try {
      // fetch rfp if not provided
      const rfpData = rfp ?? (await rfpModel.getById(rfpId));
      if (!rfpData) throw new Error(`RFP not found ${rfpId}`);

      // fetch vendor
      const vendor = await vendorModel.getById(vendorId);
      if (!vendor) throw new Error(`Vendor not found ${vendorId}`);
      if (!vendor.contact_email) throw new Error(`Vendor ${vendorId} has no email`);

      // render template
      const templateVars = {
        rfp: rfpData,
        vendor,
        requestedBy,
        rfpVendorId,
      };

      // Use message or fallback template
      let emailData;
      if (message) {
        // If custom message provided, use it
        emailData = {
          subject: `RFP: ${rfpData.title || rfpId}`,
          html: message,
          text: message,
        };
      } else {
        // Default email template
        emailData = {
          subject: `Invitation to respond to RFP: ${rfpData.title || rfpId}`,
          html: `<p>Hello ${vendor.name || vendor.contact_person || ""},</p>
                 <p>Please review our RFP: <strong>${rfpData.title || rfpId}</strong>.</p>
                 <p>${rfpData.description || ""}</p>`,
          text: `Hello ${vendor.name || ""},\n\nPlease review the RFP: ${rfpData.title || rfpId}\n\n${rfpData.description || ""}`
        };
      }

      // send mail
      const sendRes = await sendWithNodemailer({
        to: vendor.contact_email,
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      });

      console.log("Email sent successfully to", vendor.contact_email);
      return { ok: true, messageId: sendRes.messageId };
    } catch (err) {
      console.error("Failed to send RFP email:", err.message);
      throw err;
    }
  },
  { connection }
);

worker.on("failed", (job, err) => {
  console.error("Worker job failed", { id: job.id, name: job.name, reason: err.message });
});

worker.on("completed", (job) => {
  console.log("Worker job completed", { id: job.id });
});

export default worker;
*/