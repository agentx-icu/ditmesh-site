# ditmesh-site

Official bilingual website for [DitMesh](https://github.com/agentx-icu/ditmesh), served at **https://ditmesh.agentx.icu**.

The page follows the simple, no-framework style of [morsecq-site](https://github.com/agentx-icu/morsecq-site): a static HTML page, local CSS/JavaScript, and GitHub Pages deployment.

## Files

- `index.html` — English / 简体中文 landing page with language switch.
- `assets/style.css` — responsive light static styles with the DitMesh signal-card visual.
- `assets/main.js` — OS-agnostic release cards. It starts with a checked-in v1.0.0 fallback, then asks the GitHub Releases API for the newest non-draft release and rewrites links by asset suffix.
- `CNAME` — custom domain.
- `.github/workflows/pages.yml` — deploys the repository root with GitHub Pages.

## Release links

The checked-in fallback points to **DitMesh v1.0.0** (published 2026-10-10). At the time this site was created, the release contained these packages:

- macOS arm64/x86_64: `.pkg` and `.zip`
- Windows x64: `.msi` and `.zip`
- Linux x86_64: `.deb`, `.rpm`, `.tar.gz`
- Android: `.apk` and `.aab`
- iOS/iPadOS: unsigned `.ipa`
- `SHA256SUMS`

The static URLs use the exact v1.0.0 asset names. On page load, `assets/main.js` checks the latest non-draft, non-prerelease release and updates matching cards, so a future release does not leave stale download links.

## Local preview

```bash
python3 -m http.server 8000
# open http://localhost:8000/
```

## Deployment

1. In repository Settings → Pages, set **Source** to **GitHub Actions**.
2. Add the custom domain `ditmesh.agentx.icu` and enable HTTPS after DNS is ready.
3. Point DNS with a CNAME: `ditmesh.agentx.icu CNAME agentx-icu.github.io.`
4. Push to `main` or run the **pages** workflow manually.

The workflow only needs the repository's Pages permissions. No build toolchain or external fonts are required.

## Content updates

Edit both language spans when changing copy. When DitMesh publishes a release, verify the asset suffixes in `assets/main.js` still match the release assets. The dynamic lookup is intentionally best-effort; the checked-in v1.0.0 links remain usable if GitHub API access is unavailable.

## Licence

GPL-3.0, same as DitMesh. See [LICENSE](LICENSE).
