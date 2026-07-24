# Deployment Guide

Goal: deploy once properly, then every future change is `git push` and it's live in ~2 minutes — no manual server work.

Architecture: Supabase Cloud hosts the database/auth/storage. Your Linode box runs two containers — the Next.js app, and Caddy in front of it handling HTTPS automatically for your subdomain. GitHub Actions builds the app on every push and redeploys it via SSH.

```
GitHub push → GitHub Actions builds Docker image → pushes to GHCR
                                                        │
                                                        ▼
                                    SSH into Linode → docker compose pull/up
                                                        │
                        Caddy (auto HTTPS) ──▶ Next.js app ──▶ Supabase Cloud
                     app.worlebury.co.uk
```

## 1. Create the Supabase project

1. At [supabase.com](https://supabase.com), create a new project (choose a region close to your users, e.g. London/EU).
2. **Project Settings → API**: copy the Project URL, `anon` public key, and `service_role` secret key. You'll need these shortly.
3. **Database → SQL Editor**: run each file in `supabase/migrations/` in order (0001 through 0006), or use the Supabase CLI:
   ```bash
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```
4. **Authentication → Providers**: email/password is enabled by default. Since accounts are invite-only, you don't need to enable public sign-ups — leave "Allow new users to sign up" off if you want to be extra sure.
5. **Authentication → URL Configuration**: set the Site URL to your future subdomain (`https://app.worlebury.co.uk`) and add it to Redirect URLs.
6. **Authentication → Email Templates**: for production, connect a custom SMTP provider (Settings → Auth → SMTP) — e.g. Resend, Postmark, or your own mail provider — so invite emails come from `@worlebury.co.uk` rather than Supabase's shared sender, which gets rate-limited.
7. Create your first user and promote yourself to super admin — see `supabase/seed.sql` for the exact SQL (run it in the SQL Editor after you've created a user via **Authentication → Users → Add user**).

## 2. Point DNS at Linode

1. In the Linode dashboard, create (or reuse) a Linode instance — a Nanode 1GB or 2GB plan is plenty to start. Ubuntu 22.04 or 24.04 LTS.
2. Note its public IPv4 address.
3. In your DNS provider for `worlebury.co.uk`, add an **A record**: `app` → `<linode-ip>` (or whatever subdomain you prefer — update `Caddyfile` to match). Propagation is usually minutes, occasionally longer.

## 3. Push this project to GitHub

```bash
cd worlebury-app
git init && git add . && git commit -m "Initial scaffold"
gh repo create worlebury/worlebury-app --public --source=. --push
# or create the repo on github.com and `git remote add origin ...` + push
```

Use `--public` (or tick Public if creating via the website). Nothing sensitive is in the repo — Supabase keys live in `.env` on the server, which is gitignored — and a public repo means every clone/download step on the server works without needing credentials. This matters in the next step.

**Verify before moving on:** open the repo on github.com and confirm you can actually see the files (`src/`, `supabase/`, etc.), not an empty "Quick setup" page. Pushing silently failing is the single most common thing that breaks the next step.

## 4. First-time server setup (one-off)

SSH into the Linode box as root. If this is a freshly built/rebuilt server and you've connected to this IP before, clear the old host key first or SSH will refuse to connect:
```bash
ssh-keygen -R <linode-ip>
ssh root@<linode-ip>
```

Clone the whole repo, then run the setup script **from inside it** (don't try to curl the script down on its own — it depends on other files sitting next to it in the repo, and a lone `curl` against a private or not-yet-pushed repo just 404s with a confusing error):

```bash
git clone https://github.com/<you>/worlebury-app.git /opt/worlebury-app
cd /opt/worlebury-app
bash scripts/setup-server.sh
```

It will:

- install Docker + the Compose plugin
- enable `ufw` (firewall: only SSH/80/443 open) and `fail2ban`
- create `.env` from `.env.example` (**edit this with your real Supabase keys**)

It deliberately does **not** start the containers yet — no app image has been published to GHCR at this point, so there's nothing to run. The first real start happens automatically the first time you push to `main` (step 6), once GitHub Actions has built and published an image.

Before pushing, edit two files on the server:

- `/opt/worlebury-app/.env` — paste in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`.
- `/opt/worlebury-app/Caddyfile` — confirm the subdomain matches your DNS record.

For SSH key access, make sure the box has a deploy key or your GitHub Actions SSH key (see next step) as an authorized key: `ssh-copy-id -i your_deploy_key.pub deploy@<linode-ip>`. Running everything as `root` is fine for a single-purpose box; a dedicated `deploy` user with sudo is slightly better practice if you want it.

## 5. Wire up GitHub Actions for automatic deploys

In your GitHub repo, **Settings → Secrets and variables → Actions**, add:

| Secret | Value |
|---|---|
| `LINODE_HOST` | Your Linode's IP address |
| `LINODE_USER` | `root` (or your deploy user) |
| `LINODE_SSH_KEY` | Private key matching a public key authorized on the Linode box |
| `NEXT_PUBLIC_SUPABASE_URL` | From Supabase Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | From Supabase Project Settings → API |
| `NEXT_PUBLIC_APP_URL` | `https://app.worlebury.co.uk` |

`.github/workflows/deploy.yml` is already set up to run on every push to `main`: it builds the Docker image, pushes it to GitHub Container Registry, then SSHes into the box and does `docker compose pull && docker compose up -d`.

Generate a dedicated SSH keypair just for deploys (don't reuse your personal key):
```bash
ssh-keygen -t ed25519 -f deploy_key -N ""
ssh-copy-id -i deploy_key.pub root@<linode-ip>
# paste the contents of deploy_key (private) into the LINODE_SSH_KEY secret
```

## 6. First deploy

```bash
git push origin main
```

Watch it run under the **Actions** tab in GitHub. Once green, visit `https://app.worlebury.co.uk` — Caddy will have already provisioned a TLS certificate automatically on first request.

## Day-to-day: how changes go live

Just `git push` to `main`. That's it — no SSH, no manual Docker commands. Use a feature branch + PR if you want a review step before it deploys; deploys only trigger on `main`.

If you ever need to force a redeploy from the server itself (e.g. after editing `.env`), run `scripts/redeploy.sh` on the box.

## Rolling back

Every build is tagged with its Git commit SHA in GHCR, not just `latest`. To roll back:
```bash
ssh root@<linode-ip>
cd /opt/worlebury-app
IMAGE=ghcr.io/<you>/worlebury-app:<previous-sha> docker compose up -d
```

## Security checklist

- **RLS is on for every table** (`supabase/migrations/0005_rls.sql`) — the database itself refuses cross-entity reads, not just the UI.
- **Service role key never reaches the browser.** It's only used server-side in `src/lib/supabase/server.ts` (`createAdminClient`), for privileged actions like inviting users. Keep it out of any `NEXT_PUBLIC_*` variable.
- **No public sign-up** — accounts only via admin invite (enforced both in the UI and by leaving Supabase's public sign-up flow essentially unused).
- **HTTPS everywhere**, auto-renewed by Caddy, with HSTS enabled (see `Caddyfile`).
- **Firewall**: only SSH, 80, 443 open (`ufw`, set up by `setup-server.sh`). Consider restricting SSH to your IP range if it's static.
- **fail2ban** installed to blunt SSH brute-forcing.
- Turn on **2FA** on your GitHub, Supabase, and Linode accounts — these are now your three keys to the kingdom.
- Enable **Linode Backups** (small monthly fee, adds automatic daily server snapshots) and Supabase's **Point-in-Time Recovery** add-on once the app holds real business data — both are one click in their respective dashboards.
- Rotate the Supabase service role key if it's ever exposed (Project Settings → API → regenerate), and update the `.env` on the server + the GitHub secret.
- Keep `SUPABASE_SERVICE_ROLE_KEY` and `.env` out of git — already covered by `.gitignore`.

## Adding a new company (entity) later

No redeploy needed. Once you're a super admin: **Admin → Entities → Create entity**. It gets its own default sales pipeline and completely isolated data. Invite its team from **Admin → Users** after switching to it via the entity switcher in the top bar. If it needs its own subdomain (e.g. `app.othercompany.com`) rather than sharing `app.worlebury.co.uk`, add another `site` block to the `Caddyfile` and a DNS record — the app itself doesn't need any code changes since tenancy is entirely data-driven.
