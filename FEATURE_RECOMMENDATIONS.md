# Feature Recommendations — Growing the Group

What's built covers the core loop: track relationships and deals, invoice and track spend, see the numbers, manage what staff can access and use. Below are the features most likely to compound growth once that foundation is live, roughly ordered by impact-to-effort for a small group scaling up.

## High impact, worth building next

**Payments on invoices.** Add a "Pay now" link via Stripe or GoCardless on each invoice. This alone typically cuts days-sales-outstanding significantly — clients pay faster when it's one click versus a bank transfer they have to remember to do.

**Recurring/retainer invoicing.** For any client on a monthly retainer, auto-generate and send the invoice on a schedule rather than remembering each month. Straightforward addition to the `finance_invoices` table (a `recurrence_rule` + a scheduled job).

**Email integration for the CRM.** Two-way sync (or at minimum a BCC-to-log address) so emails sent to/from contacts land automatically in their activity timeline. This is usually the single biggest driver of CRM adoption — salespeople stop treating it as extra admin work.

**Quotes/proposals with e-signature.** Turn a won-stage deal into a branded PDF proposal, send for e-signature (e.g. via a service like Dropbox Sign or PandaDoc's API), and auto-create the invoice on acceptance. Shortens the lead-to-cash cycle.

**Task automation / workflow rules.** "When a deal moves to Proposal Sent, create a follow-up task in 3 days." "When an invoice is 7 days overdue, notify the owner." A simple rules engine here removes a lot of the manual chasing that causes deals and payments to go stale.

## Strong additions once the group has 2+ companies

**Group-level consolidated reporting.** A super-admin-only dashboard rolling up pipeline value, revenue, and expenses across all entities — the whole reason for building this as multi-tenant from day one rather than one-off spreadsheets per company.

**Per-entity branding.** You've got the CSS-variable theming pattern already; extending `entities` with its own colour/logo columns lets each group company feel distinct while sharing the same platform.

**Inter-company billing.** If one Worlebury company does work for another, a lightweight internal invoicing flow between entities avoids that falling back to spreadsheets.

## Useful, lower urgency

- **Client portal** — a restricted view where clients can see their own invoices and shared resources/files, without a full staff account.
- **Accounting software sync** (Xero/QuickBooks) — push paid invoices and approved expenses across automatically instead of re-entering at tax time.
- **Time tracking** — if any entity bills hourly, linking time entries to deals/invoices closes the loop from work done to invoice raised.
- **Document generation** — contract and letter templates that pull in CRM data (name, company, deal value) automatically.
- **Notifications digest** — a daily/weekly Slack or email summary (new leads, invoices due, deals stalled) rather than requiring people to check dashboards.
- **Mobile-friendly PWA** — the app is already responsive; a PWA manifest + offline shell makes it installable on staff phones for on-the-go contact/expense capture.
- **SSO** (Google Workspace/Microsoft) — once the team's big enough that password resets become a support burden.
- **Public API + webhooks** — once you want to connect this to other tools (Zapier, Make, a website contact form posting straight into CRM as a lead) without custom integration work each time.
- **Advanced reporting export** — CSV/scheduled email export of any dashboard for board packs or investor updates.
- **Audit log UI** — the `audit_log` table already exists in the schema; a simple admin screen over it is useful once you have more than a couple of admins making changes.

## Deliberately not recommended (yet)

Full HR/payroll, or a bespoke BI tool — both are well served by dedicated products (e.g. a payroll provider, or exporting data into a BI tool later) and building them in-house tends to be a lot of ongoing maintenance for value that's already available off the shelf. Worth revisiting only if the group's scale specifically outgrows what those tools offer.
