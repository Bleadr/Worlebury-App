# Deploying Worlebury — the reliable version

Rewritten after finding the gaps in the first pass: this version has a checkpoint after every command, so if something's wrong you catch it immediately instead of three steps later. Do the phases in order, don't skip a checkpoint.

Fill these in now — you'll reuse them throughout:

| Value | Yours |
|---|---|
| GitHub repo | `Bleadr/Worlebury-App` |
| Linode IP | `172.237.124.29` |
| Subdomain | `app.worlebury.co.uk` *(swap for your real one everywhere below)* |

---

## Phase 0 — one decision that avoids most failure modes

**Make the GitHub repo Public.** Nothing sensitive lives in it — API keys and passwords go in a `.env` file on the server, which is gitignored and never gets pushed. A private repo means every `curl`/clone/download step needs authentication, which is where the last attempt broke. Public sidesteps that entirely.

If `Bleadr/Worlebury-App` is currently private: on the repo page → **Settings → General → Danger Zone → Change visibility → Public**.

---

## Phase 1 — get the code onto GitHub (do this first, verify it worked)

On your **Mac**, in the project folder:
```
cd ~/Downloads/worlebury-app
git init
git add .
git commit -m "Initial version"
git branch -M main
git remote add origin https://github.com/Bleadr/Worlebury-App.git
git push -u origin main
```
It may open a browser tab to confirm you're logged into GitHub — do that.

**✓ Checkpoint — don't move on until this is true:** open `https://github.com/Bleadr/Worlebury-App` in a browser. You should see the actual file list (`src`, `supabase`, `README.md`, etc.), not an empty "Quick setup" page. If it's empty, the push above failed silently — scroll up in your terminal for the actual error and paste it to me.

---

## Phase 2 — database (Supabase)

Skip this phase if you already ran it once.

1. [supabase.com](https://supabase.com) → New Project → name it, set a DB password (save it), pick a UK/EU region → Create.
2. **SQL Editor** (left sidebar) → open each file in `supabase/migrations/` on your computer in order (`0001_core.sql` → `0006_storage.sql`), paste the full contents, click Run. One at a time.
   **✓ Checkpoint:** each run says "Success. No rows returned" before you move to the next file.
3. **Project Settings → API** → copy the Project URL, `anon public` key, and `service_role` key somewhere safe.
4. **Authentication → Users → Add user** → create your own login, tick "Auto Confirm User".
5. **SQL Editor** → run this (your user ID is on the Authentication → Users page):
   ```sql
   update public.profiles set is_super_admin = true where id = 'YOUR-USER-ID';

   insert into public.entities (name, slug, created_by)
   values ('Worlebury', 'worlebury', 'YOUR-USER-ID')
   returning id;
   ```
   Note the returned `id`, then:
   ```sql
   insert into public.entity_members (entity_id, user_id, role)
   values ('ENTITY-ID', 'YOUR-USER-ID', 'owner');

   insert into public.crm_pipelines (entity_id, name, is_default)
   values ('ENTITY-ID', 'Sales Pipeline', true)
   returning id;
   ```
   Note the returned pipeline `id`, then:
   ```sql
   insert into public.crm_pipeline_stages (pipeline_id, name, position, probability, is_won, is_lost)
   values
     ('PIPELINE-ID', 'New Lead', 1, 10, false, false),
     ('PIPELINE-ID', 'Contacted', 2, 25, false, false),
     ('PIPELINE-ID', 'Qualified', 3, 50, false, false),
     ('PIPELINE-ID', 'Proposal Sent', 4, 75, false, false),
     ('PIPELINE-ID', 'Won', 5, 100, true, false),
     ('PIPELINE-ID', 'Lost', 6, 0, false, true);
   ```
6. **Authentication → URL Configuration** → Site URL = `https://app.worlebury.co.uk`, add it under Redirect URLs too.

**✓ Checkpoint:** Authentication → Users shows your one user, marked confirmed.

---

## Phase 3 — DNS

Skip if `app.worlebury.co.uk` already points at `172.237.124.29`.

Add an **A record** in whatever manages `worlebury.co.uk`'s DNS: name `app`, value `172.237.124.29`.

**✓ Checkpoint** (wait 10–20 min after saving):
```
ping app.worlebury.co.uk
```
should reply from `172.237.124.29`. `Ctrl+C` to stop it.

---

## Phase 4 — prepare the server

On your **Mac**, connect. If the server was rebuilt since you last connected, clear the old fingerprint first:
```
ssh-keygen -R 172.237.124.29
ssh root@172.237.124.29
```
Type `yes`, enter the root password.

**✓ Checkpoint:** your prompt now reads `root@localhost:~#` (or similar) — you're inside the server, not your Mac.

Clone the repo and run the setup script **from inside it** — this is the part that broke last time; cloning the whole repo up front avoids it:
```
git clone https://github.com/Bleadr/Worlebury-App.git /opt/worlebury-app
cd /opt/worlebury-app
bash scripts/setup-server.sh
```
**✓ Checkpoint:** it ends with a message starting "Server prepared." If `git clone` instead says "Repository not found," Phase 0/1 didn't work — stop and fix that first.

Now fill in your real values:
```
nano /opt/worlebury-app/.env
```
Paste in the four Supabase-related values from Phase 2 step 3, plus `NEXT_PUBLIC_APP_NAME=Worlebury` and `NEXT_PUBLIC_APP_URL=https://app.worlebury.co.uk`. Save: `Ctrl+O`, Enter, `Ctrl+X`.

```
nano /opt/worlebury-app/Caddyfile
```
Confirm the very first line is exactly `app.worlebury.co.uk {`. Save the same way.

**Don't run `docker compose up` yet** — there's no app image published for it to start. That happens automatically in Phase 6. `exit` back to your Mac now.

---

## Phase 5 — let GitHub deploy to the server automatically

On your **Mac** (not the server), create a dedicated key so GitHub can log into the server on its own:
```
ssh-keygen -t ed25519 -f ~/worlebury_deploy_key -N ""
ssh-copy-id -i ~/worlebury_deploy_key.pub root@172.237.124.29
```
Enter the root password when asked.

**✓ Checkpoint:** test it works without a password:
```
ssh -i ~/worlebury_deploy_key root@172.237.124.29 "echo it works"
```
should print `it works` with no password prompt.

Now show the private key so you can copy it:
```
cat ~/worlebury_deploy_key
```
Copy the whole output, including the `-----BEGIN` and `-----END` lines.

On GitHub: `github.com/Bleadr/Worlebury-App` → **Settings → Secrets and variables → Actions → New repository secret**, add each of these:

| Name | Value |
|---|---|
| `LINODE_HOST` | `172.237.124.29` |
| `LINODE_USER` | `root` |
| `LINODE_SSH_KEY` | the private key you just copied |
| `NEXT_PUBLIC_SUPABASE_URL` | from Phase 2 step 3 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from Phase 2 step 3 |
| `NEXT_PUBLIC_APP_URL` | `https://app.worlebury.co.uk` |

**✓ Checkpoint:** the Secrets page lists all six names (values are hidden, that's normal).

---

## Phase 6 — go live

On your **Mac**:
```
cd ~/Downloads/worlebury-app
git commit --allow-empty -m "Deploy"
git push
```

On GitHub, open the **Actions** tab. Click into the running workflow and watch it — it builds the image (a couple of minutes), then SSHes into your server and starts it.

**✓ Checkpoint:** the workflow finishes with a green check. If it's red, click into the failed step — it'll be one of:
- **build fails**: usually a code error, paste me the log.
- **deploy/SSH step fails**: almost always a wrong secret — recheck `LINODE_HOST` and `LINODE_SSH_KEY` (must include the BEGIN/END lines) exactly.

Once green, visit `https://app.worlebury.co.uk`. Give it a few extra seconds on the very first load while it issues its own HTTPS certificate. Log in with the account from Phase 2 step 4.

---

## From here on

Every future change is just:
```
git add .
git commit -m "describe the change"
git push
```
No SSH, no server login. If you ever do need to check on the server directly:
```
ssh root@172.237.124.29
cd /opt/worlebury-app
docker compose ps        # confirms app + caddy are running
docker compose logs app  # recent app output, useful for debugging
```

## When something breaks — check in this order

1. **Which checkpoint above first failed?** That tells you which phase to redo — don't skip ahead.
2. **"Host key has changed"** → `ssh-keygen -R 172.237.124.29`, then reconnect.
3. **`curl`/`git clone` 404 or "not found"** → repo is private or empty. Fix per Phase 0/1.
4. **GitHub Actions deploy step fails** → check the six secrets in Phase 5 are exactly right.
5. **Site loads but shows an error / won't log in** → check `.env` on the server has the correct Supabase keys, and that Phase 2's SQL all ran successfully.
6. **Still stuck** → run `docker compose logs app` on the server and paste me the last 20-ish lines, plus which phase/checkpoint you're on.
