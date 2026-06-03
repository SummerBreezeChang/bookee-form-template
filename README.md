# Form Submission Template

A clean, deployable [Next.js](https://nextjs.org) starter with two ready-to-use,
fully-styled forms and a server action behind each one — so you can wire up your
own backend (email, database, CRM, payment, or a webhook) and ship.

No third-party accounts or API keys are required to run it as-is. The forms work
out of the box and just log submissions to the server console until you plug in
your own handler.

**Built with:** Next.js (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
[shadcn/ui](https://ui.shadcn.com) · Framer Motion.

---

## Quick start

**Requirements:** [Node.js](https://nodejs.org) 20 or newer.

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev
```

Then open **http://localhost:3000**.

That's it — no `.env` file or secrets needed to run the template.

> Using this repo as a GitHub **Template**? Click **"Use this template"** at the
> top of the repo page to create your own copy, then clone it and run the steps
> above.

### Other commands

| Command         | What it does                          |
| --------------- | ------------------------------------- |
| `npm run dev`   | Start the local dev server            |
| `npm run build` | Create a production build             |
| `npm start`     | Run the production build (after build)|
| `npm run lint`  | Run the linter                        |

---

## What's included

### 1. Demo request form
- **Component:** `components/demo-section.tsx` (shown on the home page, `app/page.tsx`)
- **Server action:** `app/actions/submit-demo.ts`
- **Fields:** name, email, phone, business URL, and a consent checkbox.

### 2. Setup booking flow
- **Component:** `components/book-setup-flow.tsx` (lives at `/book-setup`)
- **Server action:** `app/actions/create-setup-checkout.ts`
- **Flow:** pick a package → enter name, email, phone → agree to consent → land
  on a confirmation page (`/book-setup/success`).
- **Packages** are configured in `lib/setup-packages.ts`.

---

## Wiring up the full booking system

Want the complete experience — an AI voice agent that **calls your leads**, a
**calendar**, a **Notion database**, and **Stripe** deposits? See
**[SETUP.md](./SETUP.md)** for a step-by-step guide covering every service:

| Service | Role | Account |
| --- | --- | --- |
| **Notion** | Stores leads / bookings | notion.so |
| **Dograh** | AI voice agent that calls the lead | dograh.com |
| **Twilio** | Phone number the agent calls from | twilio.com |
| **Google Calendar** | Writes confirmed bookings | console.cloud.google.com |
| **Stripe** | Collects the setup deposit | stripe.com |

Copy **[`.env.example`](./.env.example)** to `.env.local` and fill in the keys for
the services you use (`cp .env.example .env.local`). The app runs fine with none
of them set.

---

## Making it yours

Everything you need to customize lives in a handful of files:

### Handle form submissions

Both forms call a [server action](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations).
Open the action file and replace the `// TODO` block with your own logic — send
an email, write to a database, call a CRM, or POST to a webhook:

- `app/actions/submit-demo.ts` — demo request handler
- `app/actions/create-setup-checkout.ts` — setup booking handler (return a URL to
  redirect the user, e.g. a Stripe Checkout session or your own confirmation page)

**Keep any API keys in environment variables — never commit them.** Create a
`.env.local` file (it's gitignored by default) and read values with `process.env`:

```bash
# .env.local  (example)
RESEND_API_KEY=your_key_here
DATABASE_URL=your_connection_string
```

### Edit the booking packages

Change the tiers, prices, and copy shown on `/book-setup` in
`lib/setup-packages.ts`.

### Change the branding

- Site title, description, and social/OpenGraph metadata: `app/layout.tsx`
- Global styles, colors, and fonts: `app/globals.css`
- Favicon and social image: `public/`

---

## Project structure

```
app/
  page.tsx                       # Home page → renders the demo form
  layout.tsx                     # Root layout, fonts, and site metadata
  globals.css                    # Tailwind v4 styles and theme tokens
  actions/
    submit-demo.ts               # Demo form server action  ← plug in your backend
    create-setup-checkout.ts     # Setup form server action ← plug in your backend
  book-setup/
    page.tsx                     # Setup booking flow page
    success/page.tsx             # Confirmation page
components/
  demo-section.tsx               # Demo request form
  book-setup-flow.tsx            # Setup booking form
  ui/                            # shadcn/ui primitives (button, card, input, label)
  motion/                        # Scroll / animation helpers
lib/
  setup-packages.ts              # Booking tiers + pricing config
  utils.ts                       # Shared helpers
public/                          # Static assets (favicon, images)
```

---

## Deploy

This is a standard Next.js app and deploys anywhere Next.js runs.

- **[Vercel](https://vercel.com/new)** (recommended) — import the repo and deploy;
  no configuration needed. Add any environment variables you introduced under
  **Project Settings → Environment Variables**.
- Or self-host: run `npm run build` followed by `npm start`.

---

## License

Use it however you like — this template is meant to be a starting point for your
own project.
