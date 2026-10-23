#!/usr/bin/env bash
# Rebuild and reinstall launcher + native helper on an already paired TV (no passphrase prompt).
# Same steps as install.sh after pairing; use ./install.sh for a first install or to re-pair.
set -euo pipefail
. "$(dirname "$0")/lib/tv-env.sh"
[[ -f .lgtv-key.json ]] || { echo "TV not paired yet: run ./install.sh $TV_HOST first." >&2; exit 1; }
export ZIG="${ZIG:-$(python3 -c 'from pathlib import Path; import ziglang; print(Path(ziglang.__file__).parent / "zig")')}"
reply=$(ares-novacom -d "$DEVICE" --run 'echo CYTV_SSH_OK')
[[ "$reply" == *CYTV_SSH_OK* ]] || { echo 'SSH to the TV failed: is Developer Mode still active?' >&2; exit 1; }
# Generated icons and native executables must be readable by the TV runtime after packaging.
umask 022
python3 sync-apps.py "$TV_HOST"
bash scripts/build.sh
# Use metadata rather than version globs: never install a stale release from dist/.
launcher=$(python3 -c 'import json; a=json.load(open("launcher/appinfo.json")); print("dist/"+a["id"]+"_"+a["version"]+"_all.ipk")')
helper=$(python3 -c 'import json; a=json.load(open("native/app/appinfo.json")); print("dist/"+a["id"]+"_"+a["version"]+"_arm.ipk")')
ares-install -d "$DEVICE" "$helper"
ares-install -d "$DEVICE" "$launcher"
bash scripts/configure-tv.sh
ares-launch -d "$DEVICE" com.local.nativehome
ares-launch -d "$DEVICE" com.gathin.tvhome
