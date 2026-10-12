#!/usr/bin/env python3
"""Check the checked-in release fallback against the latest GitHub release.

index.html carries hard-coded download links, file names, sizes and dates, and
the FALLBACK block in assets/main.js carries names, sizes and SHA-256 sums, so
the page works when the GitHub API is unreachable. This script fails (exit 1)
when any of them no longer matches the latest stable DitMesh release, so a
forgotten update after a release is caught by CI instead of by visitors.

Usage: python3 tools/check_release.py   (set GITHUB_TOKEN to avoid rate limits)
"""
import json
import os
import re
import sys
import urllib.request
from pathlib import Path

REPO = 'agentx-icu/ditmesh'
ROOT = Path(__file__).resolve().parent.parent


def fmt_size(n):
    # Same rounding as fmtSize() in assets/main.js.
    return f'{n / 1048576:.1f} MB' if n >= 1048576 else f'{max(1, round(n / 1024))} KB'


def latest_release():
    req = urllib.request.Request(f'https://api.github.com/repos/{REPO}/releases/latest',
                                 headers={'Accept': 'application/vnd.github+json'})
    token = os.environ.get('GITHUB_TOKEN')
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def main():
    src = (ROOT / 'index.html').read_text(encoding='utf-8')
    js = (ROOT / 'assets' / 'main.js').read_text(encoding='utf-8')
    rel = latest_release()
    tag = rel['tag_name']
    assets = {a['name']: a for a in rel['assets']}
    errors = []

    for v in set(re.findall(r'<(?:span|b)[^>]* data-version>([^<]+)<', src)):
        if v != tag:
            errors.append(f'index.html: version {v}, latest release is {tag}')
    date = rel['published_at'][:10]
    for d in set(re.findall(r'<span data-release-date>([^<]+)<', src)):
        if d != date:
            errors.append(f'index.html: release date {d}, {tag} was published {date}')
    m = re.search(r'"softwareVersion": "([^"]+)"', src)
    if not m or 'v' + m.group(1) != tag:
        errors.append(f'index.html: JSON-LD softwareVersion {m and m.group(1)}, latest release is {tag}')

    for url in sorted(set(re.findall(r'https://github\.com/' + re.escape(REPO) + r'/releases/(?:download|tag)/[^"]+', src))):
        m = re.match(r'.*/releases/(download|tag)/([^/]+)(?:/(.+))?$', url)
        if m.group(2) != tag:
            errors.append(f'index.html: link points at {m.group(2)}: {url}')
        elif m.group(1) == 'download' and m.group(3) not in assets:
            errors.append(f'index.html: {tag} has no asset {m.group(3)}')

    # Each package row: file name and size must match the release asset.
    for suffix, body in re.findall(r'<a class="pkg" data-asset="([^"]+)"[^>]*>(.*?)</a>', src, re.S):
        named = [a for n, a in assets.items() if n.endswith('-' + suffix)]
        if len(named) != 1:
            errors.append(f'index.html: {len(named)} assets in {tag} end with -{suffix}')
            continue
        a = named[0]
        pf = re.search(r'<span class="pf">([^<]+)<', body)
        ps = re.search(r'<span class="ps">([^<]+)<', body)
        if not pf or pf.group(1) != a['name']:
            errors.append(f'index.html {suffix}: file name {pf and pf.group(1)}, release has {a["name"]}')
        if not ps or ps.group(1) != fmt_size(a['size']):
            errors.append(f'index.html {suffix}: size {ps and ps.group(1)}, release has {fmt_size(a["size"])}')

    for suffix, name in re.findall(r'<span data-file="([^"]+)">([^<]+)<', src):
        if name not in assets or not name.endswith('-' + suffix):
            errors.append(f'index.html: install command names {name}, not an asset of {tag}')

    # The FALLBACK block in main.js mirrors the whole release.
    fb = re.search(r'const FALLBACK = \{(.*?)\n  \};', js, re.S)
    if not fb:
        errors.append('assets/main.js: no FALLBACK block')
    else:
        body = fb.group(1)
        for key, want in (('tag_name', tag), ('published_at', rel['published_at'])):
            m = re.search(key + r": '([^']*)'", body)
            if not m or m.group(1) != want:
                errors.append(f'main.js FALLBACK {key}: {m and m.group(1)}, release has {want}')
        if f"/download/{tag}/'" not in body:
            errors.append(f'main.js FALLBACK download URLs do not use {tag}')
        rows = {n: (int(s), h) for n, s, h in re.findall(r"\['([^']+)', (\d+), '([0-9a-f]*)'\]", body)}
        for n in sorted(set(rows) | set(assets)):
            if n not in rows:
                errors.append(f'main.js FALLBACK is missing {n}')
                continue
            if n not in assets:
                errors.append(f'main.js FALLBACK lists {n}, which {tag} does not have')
                continue
            digest = assets[n].get('digest') or ''
            want = (assets[n]['size'], digest.split(':', 1)[1] if digest.startswith('sha256:') else '')
            if n == 'SHA256SUMS':
                want = (want[0], '')  # main.js leaves the sums file's own hash out
            if rows[n] != want:
                errors.append(f'main.js FALLBACK {n}: {rows[n]}, release has {want}')

    if errors:
        print(f'Checked-in release info is out of date with {REPO} {tag}:')
        for e in errors:
            print('  - ' + e)
        print('Update index.html and the FALLBACK block as described in README "Release links".')
        return 1
    print(f'Checked-in release info matches {REPO} {tag} ({len(assets)} assets).')
    return 0


if __name__ == '__main__':
    sys.exit(main())
