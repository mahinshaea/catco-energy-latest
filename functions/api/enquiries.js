const response = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const products = new Set(["Help me choose","On-Grid Solar","Off-Grid Solar","Hybrid Solar","Lithium Batteries with Built-In Inverters","Lithium Batteries","Lead-Acid Batteries","Inverters for Backup","Automotive Batteries","On-Grid Solar Solutions","Off-Grid Solar Solutions","Hybrid Solar Solutions","Power Backup Solutions"]);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
async function digest(value) {
  const result = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(result), n => n.toString(16).padStart(2,"0")).join("");
}
export async function onRequest({request, env}) {
  const verifier=env.CATCO_PULL_VERIFIER || (env.CATCO_PULL_TOKEN?.length>=32 ? await digest("Bearer "+env.CATCO_PULL_TOKEN) : "");
  if (!env.CATCO_INBOX || !/^[a-f0-9]{64}$/.test(verifier)) return response({error:"Intake is not configured"},503);
  const db=env.CATCO_INBOX;
  const now=Math.floor(Date.now()/1000);
  if (request.method === "GET" || request.method === "PATCH") {
    const header=request.headers.get("Authorization") || "";
    if ((await digest(header)) !== verifier) return response({error:"Unauthorized"},401);
    if(request.method === "GET"){
      const rows=await db.prepare("SELECT id,payload FROM enquiries WHERE acknowledged IS NULL ORDER BY submitted,id LIMIT 25").all();
      return response({items:rows.results.map(row=>({...JSON.parse(row.payload),event_id:row.id}))});
    }
    const id=new URL(request.url).searchParams.get("id") || "";
    if(!uuid.test(id))return response({error:"Invalid ID"},400);
    await db.batch([db.prepare("UPDATE enquiries SET acknowledged=?,payload=NULL WHERE id=? AND acknowledged IS NULL").bind(now,id),
      db.prepare("DELETE FROM enquiries WHERE acknowledged<?").bind(now-86400)]);
    return response({acknowledged:true});
  }
  if(request.method !== "POST")return response({error:"Unsupported method"},405);
  if(request.headers.get("Origin") !== new URL(request.url).origin)return response({error:"Invalid origin"},403);
  if(!request.headers.get("Content-Type")?.startsWith("application/x-www-form-urlencoded"))return response({error:"Invalid form"},415);
  // Bound the body even if the sender omits Content-Length.
  const reader=request.body?.getReader();
  if(!reader)return response({error:"Missing form"},400);
  let bytes=0, decoded="";
  const decoder=new TextDecoder();
  for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>32768){await reader.cancel();return response({error:"Form too large"},413);}decoded+=decoder.decode(value,{stream:true});}
  const fields=new URLSearchParams(decoded+decoder.decode());
  if(fields.get("company-website"))return response({received:true});
  const id=fields.get("submission_id") || crypto.randomUUID();
  if(!uuid.test(id))return response({error:"Invalid receipt ID"},400);
  const data=Object.fromEntries(["name","email","phone","interest","message"].map(k=>[k,(fields.get(k)||"").trim()]));
  if(!data.name || data.name.length>160 || data.email.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) ||
    !/^\+?[\d\s().-]+$/.test(data.phone) || !/^\d{7,15}$/.test(data.phone.replace(/\D/g,"")) || data.phone.length>30 ||
    !products.has(data.interest) || !data.message || data.message.length>5000)return response({error:"Check the enquiry fields"},400);
  const hash=await digest(Math.floor(now/86400)+"|"+(request.headers.get("CF-Connecting-IP")||"local"));
  const result=await db.prepare("INSERT OR IGNORE INTO enquiries(id,payload,submitted,origin_hash) SELECT ?,?,?,? WHERE (SELECT count(*) FROM enquiries WHERE origin_hash=? AND submitted>?)<10").bind(id,JSON.stringify(data),now,hash,hash,now-3600).run();
  if(!result.meta.changes && !(await db.prepare("SELECT 1 FROM enquiries WHERE id=? AND origin_hash=?").bind(id,hash).first()))return response({error:"Please try later"},429);
  return response({received:true},201);
}
