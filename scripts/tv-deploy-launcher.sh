#!/usr/bin/env bash
# Fast iteration: package only the launcher (no native helper rebuild), install it and open it.
# Run ./install.sh instead after changing native/ or for a first install.
set -euo pipefail
. "$(dirname "$0")/lib/tv-env.sh"
[[ -s launcher/apps.js ]] || { echo "launcher/apps.js is missing: run python3 sync-apps.py $TV_HOST first." >&2; exit 1; }
# Use metadata rather than version globs: never install a stale release from dist/.
ipk=$(python3 -c 'import json; a=json.load(open("launcher/appinfo.json")); print("dist/"+a["id"]+"_"+a["version"]+"_all.ipk")')
mkdir -p dist
ares-package launcher renewal-service -o dist
ares-install -d "$DEVICE" "$ipk"
ares-launch -d "$DEVICE" com.gathin.tvhome
