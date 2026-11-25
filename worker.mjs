import { onRequest } from "./functions/api/enquiries.js";
const schema = ["CREATE TABLE IF NOT EXISTS enquiries (\n  id TEXT PRIMARY KEY, payload TEXT, submitted INTEGER NOT NULL,\n  origin_hash TEXT, acknowledged INTEGER\n)", "CREATE INDEX IF NOT EXISTS enquiries_pending ON enquiries(acknowledged, submitted)", "CREATE INDEX IF NOT EXISTS enquiries_rate ON enquiries(origin_hash, submitted)"];
let ready;
export default {
  async fetch(request,env){
    if(new URL(request.url).pathname!=="/api/enquiries")return env.ASSETS.fetch(request);
    if(!env.CATCO_INBOX)return Response.json({error:"Inbox unavailable"},{status:503});
    ready ??= env.CATCO_INBOX.batch(schema.map(s=>env.CATCO_INBOX.prepare(s))).catch(error=>{ready=undefined;throw error;});
    await ready;
    return onRequest({request,env});
  }
};
