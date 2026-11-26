# CATCO enquiry intake

The Cloudflare Worker `catco-energy-latest` serves the static site from `dist` and handles `/api/enquiries`. Browser and native form submissions receive success only after the Worker has stored the enquiry. The Worker applies the schema in `migrations/0001_enquiries.sql` through an idempotent batch.

`CATCO_INBOX` is a dedicated D1 binding provisioned from `wrangler.jsonc`. Local n8n polls the protected queue, commits each enquiry into the CRM's PostgreSQL database and acknowledges it. Acknowledgement removes the contact payload from Cloudflare. Unacknowledged enquiries remain available while the local PC is offline.

The published configuration contains the SHA-256 digest of the complete Authorization header. For collector rotation, generate a high-entropy token, change the local n8n header credential to Bearer plus the new token and deploy the corresponding verifier. Keep the raw credential in private storage. Public requests have no read access.

Test the form on a separate preview binding before changing the production handler. Verify the CRM receipt, not only the website success state. The form preserves its receipt ID when retrying.
