#!/usr/bin/env python3
"""Capture what the TV is showing into build/screenshots/ (latest.jpg plus a timestamped copy).

    python3 scripts/tv-screenshot.py 192.168.1.50

Uses the remote-control pairing saved by sync-apps.py. DRM-protected video may capture as black.
"""
import asyncio
import os
import shutil
import sys
import time
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import lgtv  # noqa: E402

OUT_DIR = os.path.join(lgtv.HERE, "build", "screenshots")


async def main(host):
    ws = await lgtv.session(host)
    try:
        res = await lgtv.call(ws, "ssap://tv/executeOneShot")
    finally:
        await ws.close()
    uri = res.get("imageUri")
    if not uri:
        sys.exit(f"The TV returned no screenshot: {res}")
    os.makedirs(OUT_DIR, exist_ok=True)
    path = os.path.join(OUT_DIR, time.strftime("tv-%Y%m%d-%H%M%S.jpg"))
    with urllib.request.urlopen(uri, context=lgtv.insecure_ctx(), timeout=20) as r, open(path, "wb") as f:
        f.write(r.read())
    latest = os.path.join(OUT_DIR, "latest.jpg")
    shutil.copyfile(path, latest)
    print(latest)


if __name__ == "__main__":
    host = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("TV_HOST")
    if not host:
        sys.exit("usage: tv-screenshot.py <TV IP>")
    asyncio.run(main(host))
