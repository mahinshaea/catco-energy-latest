// Netlify verifies the event signature before invoking this reserved function.
export default async function forwardSubmission(request) {
  const { payload } = await request.json();
  if (payload?.form_name !== "catco-enquiry") return new Response(null, { status: 204 });
  const url = process.env.CATCO_INQUIRY_WEBHOOK;
  const token = process.env.CATCO_INQUIRY_TOKEN;
  if (!url && !token) return new Response(null, { status: 204 });
  if (!url || !token || new URL(url).protocol !== "https:") {
    throw new Error("Configure both CATCO enquiry settings with an HTTPS endpoint.");
  }
  const { name, email, phone, interest, message } = payload.data;
  if (!payload.id) throw new Error("Missing Netlify submission ID");
  const response = await fetch(url, {
    method: "POST", redirect: "error", signal: AbortSignal.timeout(9000),
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({ event_id: "netlify-" + payload.id, name, email, phone, interest, message })
  });
  if (!response.ok || (await response.json()).received !== true) throw new Error("CRM receipt unavailable");
  return new Response(null, { status: 204 });
}
