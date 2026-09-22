#!/usr/bin/env sh
set -eu
if git grep -nE '(sk-[A-Za-z0-9_-]{20,}|AIza[0-9A-Za-z_-]{20,}|postgres(ql)?://[^:]+:[^@]+@)' -- ':!*.example' ':!README.md' ':!docs/*' ':!docker-compose.yml' ':!apps/api/Dockerfile'; then
  echo "Potential secret-like value found. Review before pushing."
  exit 1
fi
echo "No obvious committed secrets found."
