# Deploy: one-day demo on AWS

A throwaway deployment for a live demo, not a production environment. One
EC2 instance runs the full stack (`db`, `api`, `web`, `caddy`) via Docker
Compose. Terraform provisions the instance and its security group only, so
`terraform destroy` is a complete, verifiable teardown. See D-051 in
docs/decision-log.md for why this shape was chosen over ECS/Fargate.

## Cost

At `c6i.xlarge` (eu-central-1, on-demand) for a 12-hour demo day: roughly
$2-3 total (instance ~$2.30, 30 GB gp3 ~$0.10, public IPv4 ~$0.06, egress
free under 100 GB/month). Verify current pricing before you commit; rates
change.

## Prerequisites

- AWS credentials configured for the CLI and for Terraform (`aws configure`
  or an SSO profile). Confirm with `aws sts get-caller-identity`.
- An SSH key pair; `public_key_path` in your tfvars points at the public
  half.
- Your current public IP, for `admin_cidr`: `curl ifconfig.me`.
- `api/.env` and `web/.env` filled in locally (see each file's
  `.env.example`). They are not committed; rsync copies them to the
  instance in step 3. In `web/.env`, `PUBLIC_WEB_URL` is `https://<site_url>`,
  the address phones open from the capture QR code (D-057).

## 1. Provision the instance

```bash
cd deploy/terraform
cp terraform.tfvars.example terraform.tfvars
# edit terraform.tfvars: admin_cidr, public_key_path

terraform init
terraform plan
terraform apply
```

Capture the outputs; you will reuse them below.

```bash
terraform output
# public_ip, site_url, ssh_command, rsync_command
```

Cloud-init takes 1-2 minutes to install Docker. Poll for it before rsyncing:

```bash
ssh ubuntu@$(terraform output -raw public_ip) 'test -f /opt/chahed/CLOUD_INIT_DONE && echo ready'
```

## 2. Copy the repo to the instance

Run from the repo root (not `deploy/terraform`):

```bash
ssh ubuntu@<public_ip> 'mkdir -p /opt/chahed/app'
rsync -az --exclude-from=deploy/rsync-exclude.txt ./ ubuntu@<public_ip>:/opt/chahed/app/
```

`deploy/rsync-exclude.txt` mirrors `.gitignore` and excludes local Terraform
state. It does **not** exclude `api/.env` or `web/.env`: rsync is how those
secrets reach the instance, since they never go through git.

## 3. Bring the stack up

On your own machine, get the hostname (strip the `https://`):

```bash
terraform -chdir=deploy/terraform output -raw site_url
# https://3-120-45-6.sslip.io
```

Then, on the instance. `sudo` resets the environment by default (Ubuntu's
stock sudoers), so a plain `export` before it is invisible to the sudo'd
process: set the variable on the `sudo` command itself, every time, rather
than exporting it first.

```bash
ssh ubuntu@<public_ip>
cd /opt/chahed/app
export SITE_ADDRESS=3-120-45-6.sslip.io   # paste your value, no scheme; kept for reference below

sudo SITE_ADDRESS=$SITE_ADDRESS docker compose -f deploy/docker-compose.prod.yml up -d --build
```

The first build takes 15-25 minutes: the API image installs `torch` and
downloads the embedding model at build time. Watch it with:

```bash
sudo SITE_ADDRESS=$SITE_ADDRESS docker compose -f deploy/docker-compose.prod.yml logs -f
```

Caddy requests its Let's Encrypt certificate on first request to port 80;
give it a few seconds after the containers report healthy.

## 4. Smoke test

```bash
curl -s https://<site_url>/api/v1/health
# {"status": "ok"}
```

Then open `<site_url>` in a browser and walk the demo path end to end.

### Seed the demo dataset

`seed/seed_demo_data.py` uploads the five hero fixtures through the real
`POST /documents` pipeline (not a DB insert), so it needs a working API,
loaded rules, and a real `OPENROUTER_API_KEY` already in `api/.env` on the
instance (it reads that key through the running API, not from the local
machine).

**Run it from the instance, inside the compose network, not against the
public `site_url`.** `caddy` only reverse-proxies to `web` (`Caddyfile`), and
`web/app/api/v1/[...path]/route.ts` derives the bearer header it forwards
to the API from its own session cookie, discarding any `Authorization`
header the caller already sent (D-054): a script setting its own bearer
token against the public URL gets `401 {"detail": "not signed in"}` on
every call past sign-up/sign-in, since sign-up and sign-in are the only two
routes that need no existing session to answer. This is the same
architecture as a real browser session, not a bug to route around by
opening the API container's port. Run the script as a one-off container on
the compose network instead, reaching `api` directly by its internal
hostname:

```bash
ssh ubuntu@<public_ip>
cd /opt/chahed/app
export SITE_ADDRESS=3-120-45-6.sslip.io   # paste your value, no scheme; kept for reference below
```

Pick a strong demo password, never written to the repository since the site
is public, and create the officer account first, entering that password at
the prompt (`sudo` needs `SITE_ADDRESS` passed on its own command line here
too, same reason as step 3):

```bash
sudo SITE_ADDRESS=$SITE_ADDRESS docker compose -f deploy/docker-compose.prod.yml exec api \
  uv run python -m app.auth.create_user officer@dgi.tn officer
```

Then run the seed script itself as a throwaway container, with the repo's
own `seed/` and `fixtures/` mounted in (the `api` image does not bundle
either, per `api/Dockerfile`) and `CHAHED_API_BASE_URL` pointed at `api`'s
internal address, not the public one:

```bash
sudo SITE_ADDRESS=$SITE_ADDRESS docker compose -f deploy/docker-compose.prod.yml run --rm \
  -v /opt/chahed/app/seed:/seed:ro \
  -v /opt/chahed/app/fixtures:/fixtures:ro \
  -e CHAHED_API_BASE_URL=http://api:8000/api/v1 \
  -e CHAHED_DEMO_PASSWORD='<password>' \
  api uv run --no-dev python /seed/seed_demo_data.py
```

If `fixtures/hero/*.pdf` are missing, generate them first with
`seed/generate_fixtures.py` (see that file's docstring), then rsync again
before this step.

## 5. Teardown

As soon as the demo is over:

```bash
cd deploy/terraform
terraform destroy
```

Then confirm nothing is left running, since a failed destroy step can leave
a resource behind silently:

```bash
aws ec2 describe-instances --region eu-central-1 \
  --filters "Name=tag:Name,Values=chahed-demo" \
  --query 'Reservations[].Instances[].State.Name'
# expect: [] or ["terminated"]
```

## 6. Set up continuous deployment (one-time)

After the manual steps above have put the stack up once, register the
instance as a GitHub Actions self-hosted runner so every push to `main`
redeploys automatically (`.github/workflows/deploy.yml`, D-061). The job
runs on the box itself: GitHub-hosted runners have no stable IP, and the
security group only allows SSH from `admin_cidr` by design (D-051), so
running the deploy locally avoids opening that up or storing any SSH key
or AWS credential in GitHub.

1. Move the two secret files out of the git working tree, to a path the
   workflow restores into place on every run (a fresh `actions/checkout`
   would otherwise leave them missing, since they are untracked):

   ```bash
   ssh ubuntu@<public_ip>
   mkdir -p /opt/chahed/env
   cp /opt/chahed/app/api/.env /opt/chahed/env/api.env
   cp /opt/chahed/app/web/.env /opt/chahed/env/web.env
   ```

2. On GitHub: repo Settings > Actions > Runners > New self-hosted runner,
   Linux x64. Copy the `--url` and `--token` values from the generated
   `config.sh` command; the token expires in about an hour, so do step 3
   promptly after.

3. On the instance, install the runner as the `ubuntu` user, not root: the
   deploy step needs `ubuntu`'s docker group membership (`user_data.sh`),
   which a fresh systemd service picks up cleanly, so no `sudo` workaround
   is needed here the way step 3 above needs one for an inherited SSH
   session.

   ```bash
   sudo mkdir -p /opt/actions-runner
   sudo chown ubuntu:ubuntu /opt/actions-runner
   cd /opt/actions-runner
   curl -o actions-runner.tar.gz -L \
     https://github.com/actions/runner/releases/download/v<version>/actions-runner-linux-x64-<version>.tar.gz
   tar xzf actions-runner.tar.gz
   ./config.sh --url https://github.com/<org>/<repo> --token <token> \
     --labels chahed-demo --unattended
   sudo ./svc.sh install ubuntu
   sudo ./svc.sh start
   ```

4. Confirm the runner shows "Idle" under Settings > Actions > Runners, then
   push to `main` (or re-run the workflow) to verify a full deploy.

Re-provisioning a fresh instance from scratch (after a `terraform destroy`)
still starts with steps 1-4 above once (rsync included); redo this section
afterward instead of relying on manual rsync/compose for ongoing deploys.

## 7. Custom domain (optional)

To serve the site at a real hostname instead of the sslip.io address (e.g.
`chahed.<yourdomain>`), point DNS at the instance and switch `SITE_ADDRESS`
to that hostname instead of deriving it from the instance's own IP (D-063).

1. In your DNS provider (this project uses Cloudflare): add an `A` record,
   name `chahed` (or whichever subdomain), value the instance's current
   public IP (`terraform -chdir=deploy/terraform output -raw public_ip`).
   Set it **DNS only** (grey cloud), not proxied: Caddy needs to see the
   real client connection on port 80 to complete the Let's Encrypt HTTP-01
   challenge itself, the same way it already does for the sslip.io address.
2. In GitHub: Settings > Secrets and variables > Actions > Variables > New
   repository variable, name `SITE_ADDRESS`, value the full hostname (e.g.
   `chahed.example.com`). The workflow reads this instead of computing an
   address from the instance's IP, and fails loudly, naming the variable,
   if it is unset (root CLAUDE.md's configuration rule: an identity-bearing
   value gets no default).
3. Push to `main` (or re-run the workflow). Caddy requests a fresh
   certificate for the new hostname on first request; give it a few seconds
   after the deploy step completes before the smoke test's first attempt
   succeeds.

There is still no Elastic IP (D-051, kept on purpose). If the instance is
ever stopped and started (not just rebooted: that keeps the same IP), its
public IP changes and the Cloudflare `A` record must be updated by hand
before the site resolves again.

## Notes and limitations

- No Elastic IP: intentional, to avoid a resource that can outlive the
  instance and keep billing. This means the instance must stay running for
  the whole demo window; stopping and restarting it changes the IP and
  invalidates the sslip.io hostname and certificate.
- `admin_cidr` is a single IP. If you switch networks, update
  `terraform.tfvars` and re-`apply` (only the security group rule changes).
- Postgres data lives in a named Docker volume on the instance, so
  container restarts during the demo do not lose data; destroying the
  instance does.
- Continuous deployment (section 6) assumes the instance now stays up
  between rehearsals rather than being torn down after each one (D-061);
  the "one-day, fully torn down" framing above still applies once the
  demo window has actually closed and `terraform destroy` is run.
