#!/usr/bin/env bash
# Print one-line base64 for GitHub secret ORACLE_SSH_PRIVATE_KEY_B64
# Usage: ./scripts/print-github-ssh-b64.sh "/path/to/ssh-key.key"
set -euo pipefail

KEY="${1:-}"
if [ -z "$KEY" ] || [ ! -f "$KEY" ]; then
  echo "Usage: $0 /path/to/your-oracle-ssh-key.key"
  exit 1
fi

if ! head -1 "$KEY" | grep -q 'BEGIN.*PRIVATE KEY'; then
  echo "Error: file does not look like a PEM private key."
  exit 1
fi

echo "Copy the SINGLE line below into GitHub → Secrets → ORACLE_SSH_PRIVATE_KEY_B64"
echo "Then delete any old ORACLE_SSH_PRIVATE_KEY from Variables/Secrets."
echo "---"
base64 -w 0 "$KEY"
echo ""
echo "---"
echo "Done. Do not commit or share this output."
