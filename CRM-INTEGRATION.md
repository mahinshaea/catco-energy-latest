# Connect catcoenergy.in to a CRM on a private PC

The website integration is on the website repository's `codex/cloudflare-crm-intake` branch. This branch keeps the existing catalogue, WhatsApp links, form styling and form fields. The JavaScript submit handler expects a JSON receipt after a successful database write.

## Cloudflare configuration

For **Pages**, deploy from the repository root with `dist` as the static output directory. The endpoint is `functions/api/enquiries.js`. For **Workers with Static Assets**, set the existing project's entry point to `worker.mjs`, use `dist` for assets, bind them under `ASSETS`, and run the Worker first for `/api/enquiries`. Keep the existing custom domain and other project bindings. The Worker adapter and Pages function share the same handler.

1. Create a dedicated Cloudflare D1 database for incoming enquiries. Bind it as `CATCO_INBOX` in the intended preview or production environment. Run `migrations/0001_enquiries.sql` in that database using the D1 console or `wrangler d1 execute <database-name> --remote --file migrations/0001_enquiries.sql`.
2. Add the server-side secret `CATCO_PULL_TOKEN` to that environment, with at least 32 random characters. Use the matching value in the local n8n credential named **CATCO Cloudflare pull**, as an Authorization header with the value `Bearer <token>`. Keep the token out of JavaScript, Git, screenshots and support messages.
3. Deploy and verify a branch preview using a separate D1 binding, secret and labelled test submission. Set both HTTP nodes in the pull workflow to the preview hostname for this test. Once verified, merge the integration into the production branch, set production bindings, redeploy, restore the production hostname and publish **Pull Cloudflare enquiries**.
4. Verify one submission, its CRM timeline and the acknowledgement. Inspect the pending queue using the authenticated GET endpoint. Acknowledgement clears the contact payload. Only a receipt and rate-limit metadata remain until cleanup on a subsequent acknowledgement.

The local n8n scheduler reads batches of 25 entries every five minutes. A successful CRM commit precedes Cloudflare acknowledgement. The stable receipt ID makes a retry safe even if the acknowledgement fails. The PC only needs outbound HTTPS. Direct calls and WhatsApp links bypass the form.

A queue outage returns an error to the visitor. The form retains the entered values and its retry ID. Verify Cloudflare monitoring and storage limits in the owning account. A contact-identity conflict stops that workflow execution and retains the entry for staff review.

[Cloudflare Pages bindings](https://developers.cloudflare.com/pages/functions/bindings/) · [Workers static assets](https://developers.cloudflare.com/workers/static-assets/binding/)
