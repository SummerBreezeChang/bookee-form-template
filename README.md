# Form Submission Template

A Next.js template with two ready-to-use forms:

- Demo request form — components/demo-section.tsx
- Setup booking form — components/book-setup-flow.tsx

Both forms call server actions where you plug in your own backend
(email, database, CRM, payment, or a webhook):

- app/actions/submit-demo.ts
- app/actions/create-setup-checkout.ts

## Development

\`\`\`bash
pnpm install
pnpm dev
\`\`\`

Open http://localhost:3000

No secrets or third-party accounts are required to run as-is.
Keep any API keys you add in environment variables — never commit them.
