#!/usr/bin/env bash
# AWS EC2 (Ubuntu 22.04/24.04) serverni bir marta tayyorlash.
# Ishlatish: ssh ubuntu@SERVER_IP 'bash -s' < deploy/setup-server.sh
set -euo pipefail

sudo apt-get update -y
sudo apt-get install -y ca-certificates curl

if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sudo sh
fi
sudo usermod -aG docker "$USER"

sudo mkdir -p /opt/uniflow/uploads/{videos,photos,files}
sudo chown -R "$USER":"$USER" /opt/uniflow

if ! swapon --show | grep -q swapfile; then
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

echo "Tayyor. Endi /opt/uniflow/.env faylini yarating va qayta SSH qiling (docker guruhi uchun)."
