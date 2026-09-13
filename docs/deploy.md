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
  the address phones open from the capture QR code (D-056).

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

Then, on the instance:

```bash
ssh ubuntu@<public_ip>
cd /opt/chahed/app
export SITE_ADDRESS=3-120-45-6.sslip.io   # paste your value, no scheme

sudo docker compose -f deploy/docker-compose.prod.yml up -d --build
```

The first build takes 15-25 minutes: the API image installs `torch` and
downloads the embedding model at build time. Watch it with:

```bash
sudo docker compose -f deploy/docker-compose.prod.yml logs -f
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
machine). Run it from your own machine against the deployed API, since it is
a developer script with its own Python deps, not part of either container.

Every call is signed in (D-054). Pick a strong demo password, never written to
the repository since the site is public, and create the officer account on the
instance first, entering that password at the prompt:

```bash
docker compose -f deploy/docker-compose.prod.yml exec api \
  uv run python -m app.auth.create_user officer@dgi.tn officer
```

The script signs the two MSME owners up with the same password:

```bash
CHAHED_API_BASE_URL=https://<site_url>/api/v1 CHAHED_DEMO_PASSWORD='<password>' \
  api/.venv/bin/python seed/seed_demo_data.py
```

If `fixtures/hero/*.pdf` are missing, generate them first with
`seed/generate_fixtures.py` (see that file's docstring).

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
