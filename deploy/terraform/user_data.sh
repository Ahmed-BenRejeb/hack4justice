#!/bin/bash
# Cloud-init bootstrap: installs Docker Engine + the Compose plugin from
# Docker's official apt repo (docs.docker.com/engine/install/ubuntu), and
# nothing else. No app code, no secrets: the repo and the .env files are
# copied in separately over rsync (see docs/deploy.md), so this script has
# nothing identity-bearing to leak.
set -euxo pipefail

apt-get update
apt-get install -y ca-certificates curl gnupg

install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

# shellcheck disable=SC1091
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

usermod -aG docker ubuntu

mkdir -p /opt/chahed
chown ubuntu:ubuntu /opt/chahed

# Marker the runbook polls for over SSH before the first rsync.
touch /opt/chahed/CLOUD_INIT_DONE
