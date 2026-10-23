# Shared settings for the tv-* scripts: TV address, ares profile and the pinned local tools.
# Source it from the repo root or any script: it changes to the repo root itself.
cd "$(dirname "${BASH_SOURCE[0]}")/../.." || return 1
if [[ -f .env ]]; then set -a; . ./.env; set +a; fi
: "${TV_HOST:?Set TV_HOST in .env (copy .env.example)}"
DEVICE="${DEVICE:-clean-your-tv-${TV_HOST//./-}}"
export TV_HOST DEVICE
# install.sh pins the webOS CLI and Python packages locally; prefer those over global ones.
export PATH="$PWD/build/tools/node_modules/.bin:$PWD/.venv/bin:$PATH"
