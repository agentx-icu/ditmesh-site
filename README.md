# ditmesh-site

Official bilingual website for [DitMesh](https://github.com/agentx-icu/ditmesh), served at **https://ditmesh.agentx.icu**.

The page follows the simple, no-framework style of [morsecq-site](https://github.com/agentx-icu/morsecq-site): static HTML, local CSS/JavaScript, and GitHub Pages deployment.

## Files

- `index.html` — English / 简体中文 landing page with a language switch.
- `assets/style.css` — responsive light/dark styles with the DitMesh signal-card visual.
- `assets/main.js` — long-lived release resolver. It starts with a checked-in v1.0.0 fallback, then asks GitHub's `/releases/latest` endpoint for the newest stable release and rewrites each package link by a stable asset suffix.
- `CNAME` — custom domain.
- `.github/workflows/pages.yml` — deploys the repository root with GitHub Pages.

## Release links

DitMesh release assets currently carry a version in their filename (for example `ditmesh-1.0.0-macos-arm64.pkg`). The page therefore matches each asset by its stable suffix (`macos-arm64.pkg`, `windows-x64.msi`, `android.apk`, and so on) instead of baking a version into the JavaScript. On every page load, `assets/main.js` calls GitHub's stable `/releases/latest` resolver and swaps in the exact `browser_download_url` for the newest release. This avoids links to an older release when a new version is published while keeping the checked-in v1.0.0 package URLs usable if JavaScript or the GitHub API is unavailable.

The latest checked release at site creation is **DitMesh v1.0.0**, published 2026-10-10:

- macOS arm64/x86_64: `.pkg` and `.zip`
- Windows x64: `.msi` and `.zip`
- Linux x86_64: `.deb`, `.rpm`, `.tar.gz`
- Android: `.apk` and `.aab`
- iOS/iPadOS: unsigned `.ipa`
- `SHA256SUMS`

If a future stable release is missing a package or has duplicate suffix matches,
the resolver disables that individual link instead of silently retaining the
v1.0.0 fallback URL. This keeps the release heading and every active download
link on the same release while making incomplete release assets visible.

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

Edit both language spans when changing copy. When DitMesh publishes a release, verify the asset suffixes still match the release assets. The dynamic latest-release lookup is intentionally best-effort; the checked-in v1.0.0 links remain usable if GitHub API access is unavailable.

## Licence

GPL-3.0, same as DitMesh. See [LICENSE](LICENSE).
