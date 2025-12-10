// Use OpenAI to convert raw_email to structured JSON

import OpenAI from "openai";
import dotenv from 'dotenv';
dotenv.config({path:'../../.env'});


const client = new OpenAI({
    apiKey: process.env.OPEN_AI_SECRET_KEY
})

async function callOpenAi({ messages = [], model = "gpt-4o-mini", max_tokens = 1000, temperature = 0 }) {
  if (!process.env.OPEN_AI_SECRET_KEY) {
    throw new Error("OPEN_AI_SECRET_KEY not configured");
  }

  try {
    const res = await client.chat.completions.create({
      model,
      messages,
      max_tokens,
      temperature,
    });

    // Defensive path to extract text
    const rawText =
      res?.choices?.[0]?.message?.content ??
      // Some SDKs use "text" or "content" in different shapes — include fallback
      (typeof res?.choices?.[0]?.text === "string" ? res.choices[0].text : null) ??
      JSON.stringify(res); // fallback to entire response for debugging

    console.debug("OpenAI response length:", rawText ? rawText.length : 0);
    return rawText;
  } catch (err) {
    // Surface error with context
    console.error("OpenAI call failed:", err?.message ?? err);
    throw err;
  }
}
function extractJson(text) {
  // Try to find the largest JSON object in text (first { ... } or [ ... ])
  if (!text || typeof text !== "string") return null;
  const firstBrace = text.indexOf("{");
  const firstBracket = text.indexOf("[");
  const start = (firstBrace === -1) ? firstBracket : (firstBracket === -1 ? firstBrace : Math.min(firstBrace, firstBracket));
  if (start === -1) return null;

  // Try to find a matching closing brace/bracket by scanning
  let stack = [];
  const openChar = text[start];
  const closeChar = openChar === "{" ? "}" : "]";
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{" || ch === "[") stack.push(ch);
    else if (ch === "}" || ch === "]") {
      stack.pop();
      if (stack.length === 0) {
        const candidate = text.slice(start, i + 1);
        try {
          return JSON.parse(candidate);
        } catch (e) {
          // parsing failed — maybe JSON contains trailing text or is not pure; continue searching for next candidate
        }
      }
    }
  }
  // fallback: try to find substring between first { and last }
  try {
    const last = Math.max(text.lastIndexOf("}"), text.lastIndexOf("]"));
    if (last > start) {
      const candidate = text.slice(start, last + 1);
      return JSON.parse(candidate);
    }
  } catch (e) {
    // ignore
  }
  return null;
}


export async function parseRfp(nl,meta={}){
    if (!nl || typeof nl !== "string") {
    throw new Error("nl (string) required");
  }
   const prompt=[
     { 
  role: "system", 
  content: `You are an assistant that converts natural-language RFP descriptions into a highly structured JSON 
  representation. Output ONLY VALID JSON. The required schema includes complex, nested fields for project scope, 
  phased timeline, and weighted evaluation criteria. Ensure all extracted dates are in ISO 8601 format (YYYY-MM-DD) 
  and all evaluation weights in the 'criteria' array sum to 100%.` 
},
     {
  role: "user",
  content:
    `Convert the following RFP description into a JSON object using the required comprehensive schema. If you can infer better values, fill them. If uncertain, use null.

Schema Keys and Structure:
- metadata (object): Administrative details, legal identifiers, and contacts. Keys: procurement_id, project_title, issuing_organization, confidentiality_level, contacts (array of strings).
- scope (object): Statement of Work (SOW), defining project objectives and technical requirements.[1] Keys: summary, goals_and_metrics (array of strings), technical_requirements (array of strings), deliverables (array of strings), risks_roadblocks (array of strings).
- items (array of objects): Quantifiable goods or defined services/resources.[2] Keys per item: name (string), qty (integer), specs (object).
- budget (number or null): Stated overall budget or estimated ceiling.
- timeline (object): Structured dates for the process and project execution.[3] Keys: project_duration (string), process_dates (array of { event: string, date: string }), milestones (array of { description: string, deadline: string, dependencies: array of strings }).
- evaluation (object): Weighted scoring logic and mandatory compliance gates.[4] Keys: criteria (array of { name: string, weight: integer (percent), rationale: string }), compliance_checks (array of mandatory pass/fail requirements).
- submission_requirements (object): Specific rules for proposal formatting and delivery. [5] Keys: required_format (string), max_pages (integer or null), required_sections (array of strings), delivery_method (string).
- payment_terms (string or null)
- warranty (string or null)
- notes (string or null)

Return ONLY JSON. Example output:
{
  "metadata": {
    "procurement_id": "P2024-412",
    "project_title": "Cloud ERP System Implementation",
    "issuing_organization": "GlobalTech Corp",
    "confidentiality_level": "Internal Only [5]",
    "contacts":[6]
  },
  "scope": {
    "summary": "Implementation of a new cloud-based ERP solution, replacing legacy systems and integrating with existing CRM infrastructure.",
    "goals_and_metrics":", "Complete user acceptance testing within 6 weeks"],
    "technical_requirements":", "System must handle 1000 concurrent users"],
    "deliverables":"],
    "risks_roadblocks": ["Legacy system data is unstructured and requires manual cleaning ", "Limited internal resource availability during Q4 rollout"]
  },
  "items": },
    { "name": "Software Licenses", "qty": 500, "specs": { "type": "Named User", "version": "Enterprise 3.0" } [2] }
  ],
  "budget": 1500000,
  "timeline": {
    "project_duration": "18 Months [10]",
    "process_dates":,
    "milestones":[6] },
      { "description": "Phase 2: System Configuration & Build", "deadline": "2025-06-30", "dependencies":[11] }
    ]
  },
  "evaluation": {
    "criteria": },
      { "name": "Pricing & Total Cost of Ownership", "weight": 25, "rationale": "Cost-effectiveness is key for capital investment." [13] },
      { "name": "Implementation Approach", "weight": 40, "rationale": "Strategy for integration and minimizing business disruption." } [7],
    "compliance_checks": [
      "Must be legally registered to transact business in Illinois [14]",
      "Must possess current ISO 27001 certification [7]",
      "Proposal must be submitted electronically and in triplicate [15]"
    ]
  },
  "submission_requirements": {
    "required_format": "PDF document with all attachments in appendix",
    "max_pages": 40,
    "required_sections":[2]
    "delivery_method": "Upload to secure vendor portal only"
  },
  "payment_terms": "Net 45 upon completion of Milestones 1, 2, and 3",
  "warranty": "Standard 1 year post-deployment bug fix warranty",
  "notes": "Weekly progress meetings are mandatory for the duration of the project."
}

Now parse this RFP:
---
${nl}
---
If you can infer better values, fill them. If uncertain, use null.`
}
   ]

   let rawRes;
   try {
     rawRes=await callOpenAi({messages:prompt,model: 'gpt-4o-mini', max_tokens: 1000, temperature: 0.1 })
   } catch (error) {
    console.log("error while uploading parseRfp : ",error);
   }
  // const correctionPrompt=`Produce valid JSON matching the schema: ${JSON.stringify(rfpSchema, null, 2)}. Only JSON.`;
   console.log("Raw model output (truncated 1000 chars):", rawRes ? rawRes.slice(0, 1000) : rawRes);

  // Try to parse JSON out of the model output
  const parsed = extractJson(rawRes);
  if (!parsed) {
    console.warn("Could not extract JSON from model output. Returning raw string for inspection.");
    // Optionally: throw new Error("Model did not return valid JSON"); // choose behavior you prefer
    return { raw: rawRes, parsed: null };
  }

  return parsed;
}

export async function jsonifyProposalEmail(raw_email) {
  if (!raw_email || typeof raw_email !== 'string') throw new Error('raw_email (string) required');
  const prompt = [
    {
      role: 'system',
      content: `You are an assistant that extracts structured proposal data from raw email text. Output ONLY valid JSON. Capture all relevant fields such as vendor name, cost, delivery timeline, quality metrics, support, reliability, compliance, business stability, and any other proposal details. If a value is missing, use null.`
    },
    {
      role: 'user',
      content: `Extract all possible proposal fields from the following email and return as a JSON object.\n\n---\n${raw_email}\n---`
    }
  ];
  let rawRes;
  try {
    rawRes = await callOpenAi({ messages: prompt, model: 'gpt-4o-mini', max_tokens: 1000, temperature: 0.1 });
  } catch (error) {
    console.log('error while calling OpenAI for jsonifyProposalEmail:', error);
    throw error;
  }
  const parsed = extractJson(rawRes);
  if (!parsed) {
    console.warn('Could not extract JSON from model output. Returning raw string for inspection.');
    return { raw: rawRes, parsed: null };
  }
  return parsed;
}

// Use OpenAI to score a vendor's parsed proposal against the RFP
export async function scoreVendorProposal({ parsedProposal, rfpStructured }) {
  if (!parsedProposal || !rfpStructured) throw new Error('Both parsedProposal and rfpStructured are required');
  const prompt = [
    {
      role: 'system',
      content: `You are an expert evaluator. Score a vendor's proposal against an RFP. Use these metrics: 0. Requirements Fulfillment, 1. Cost & Financial, 2. Delivery & Timeline, 3. Quality (Defect Rate, Return Rate), 4. Service & Support, 5. Reliability (Failure Rate), 6. Compliance & Risk, 7. Business Stability (Years in Operation, Client Retention Rate). Output a JSON object with a score (0-100) for each metric, a totalScore, and a short recommendation_reason.`
    },
    {
      role: 'user',
      content: `RFP (structured):\n${JSON.stringify(rfpStructured, null, 2)}\n\nVendor Proposal (parsed):\n${JSON.stringify(parsedProposal, null, 2)}\n\nScore this proposal and explain.`
    }
  ];
  let rawRes;
  try {
    rawRes = await callOpenAi({ messages: prompt, model: 'gpt-4o-mini', max_tokens: 800, temperature: 0.1 });
  } catch (error) {
    console.log('error while calling OpenAI for scoreVendorProposal:', error);
    throw error;
  }
  const parsed = extractJson(rawRes);
  if (!parsed) {
    console.warn('Could not extract JSON from model output. Returning raw string for inspection.');
    return { raw: rawRes, parsed: null };
  }
  return parsed;
}