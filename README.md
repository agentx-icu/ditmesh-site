# ditmesh-site

Official website for [DitMesh](https://github.com/agentx-icu/ditmesh), served at
**https://ditmesh.agentx.icu**.

A static site (no build toolchain, third-party fonts or trackers) in English and 简体中文,
laid out like [toxee-site](https://github.com/agentx-icu/toxee-site):

| URL | Language |
| --- | --- |
| `/` | follows the visitor's browser language, with an EN / 中文 toggle |
| `/en/` | English |
| `/zh/` | 简体中文 |

## Layout

| Path | What |
| --- | --- |
| `index.html` | The single source page. Every text node exists in both languages as `<span class="en">` / `<span class="zh">`; `html[data-lang]` picks one. |
| `en/index.html`, `zh/index.html` | **Generated** language-pinned copies. Never edit by hand; run `python3 tools/build_lang_pages.py` after every change to `index.html`. |
| `tools/build_lang_pages.py` | The generator for the two pages above; it also localizes the `SoftwareApplication` JSON-LD block. |
| `tools/check_site.py` | Fails when `index.html` or `404.html` reference a missing local file or `#anchor`, when an English string has no Chinese counterpart, when a screenshot is missing for one language, when the JSON-LD is invalid, or when `sitemap.xml` does not list `/`, `/en/` and `/zh/`. |
| `tools/check_release.py` | Fails when the checked-in release info (links, file names, sizes and dates in `index.html`, the `FALLBACK` block in `assets/main.js`, the JSON-LD `softwareVersion`) no longer matches the latest release. |
| `404.html` | Bilingual not-found page with absolute links (GitHub Pages serves it for any missing path). |
| `assets/style.css` | Styles. Light theme follows the app's teal and brass; dark mode follows `prefers-color-scheme`. |
| `assets/main.js` | Language toggle, the phone menu, the full-size screenshot viewer, tabs, copy buttons, OS detection, the Morse tape and the release resolver. |
| `assets/img/app_icon.png`, `favicon.png` | The app icon (from `apps/ditmesh/macos/Runner/Assets.xcassets`). |
| `assets/img/{en,zh}/{desktop,ios,ipad,android}/` | WebP copies of the real UI captures in `ditmesh/doc/screenshots` (desktop = macOS). |
| `assets/img/{en,zh}/og.jpg` | Social preview image per language. |
| `CNAME`, `.nojekyll` | GitHub Pages custom domain and raw static serving. |
| `sitemap.xml`, `robots.txt` | Search-engine sitemap (`/`, `/en/`, `/zh/` with hreflang alternates) and the robots file pointing at it. Update both if pages are added. |
| `.github/workflows/pages.yml` | Deploys the repository root with GitHub Pages. |
| `.github/workflows/check.yml` | On pushes, pull requests and daily: fails if `en/` / `zh/` were not regenerated, if `tools/check_site.py` finds a broken link or translation, or if `tools/check_release.py` finds stale release info. |

## Release links

DitMesh release assets carry the version in their filename (for example
`ditmesh-1.0.1-macos-arm64.pkg`). The page therefore matches each package by its
stable suffix (`macos-arm64.pkg`, `windows-x64.msi`, `android.apk`, and so on). On
every page load `assets/main.js` asks GitHub's stable `/releases/latest` resolver for
the newest release and swaps in each exact `browser_download_url`, file name, size and
SHA-256 digest. The hero button links the package for the detected OS (and CPU, when
the browser reveals it); the matching download card and install tab are preselected.

If a stable release is missing a package, or has more than one asset with the same
suffix, that link is disabled instead of silently pointing at an older release. This
keeps the version heading and every active download link on the same release.

When JavaScript or the GitHub API is unavailable, the static links in `index.html` and
the `FALLBACK` block at the top of `assets/main.js` are used. **After each DitMesh
release, update `FALLBACK` (names, sizes, SHA-256) and the hard-coded `1.0.1` links in
`index.html` (and the JSON-LD `softwareVersion`), then regenerate `en/` and `zh/`.**
`python3 tools/check_release.py` lists anything still out of date; the `check`
workflow runs it every day.

## Screenshots

To refresh the images after the app's captures change, convert them from a DitMesh
checkout (needs ImageMagick and `cwebp`):

```bash
S=../ditmesh/doc/screenshots
for l in en zh; do
  for s in conversation group_conversation listen reference translator me network_bootstrap backup_wizard chat_list contacts; do
    magick $S/macos/$l/$s.png -resize 1280x png:- | cwebp -quiet -q 80 -m 6 -o assets/img/$l/desktop/$s.webp -- -
  done
done
```

Phones use 440 px (iOS) and 412 px (Android) widths; the iPad uses 774 px.

## Local preview

```bash
python3 -m http.server 8000
# open http://127.0.0.1:8000/, /en/ or /zh/
```

## Deployment

1. In repository Settings → Pages, set **Source** to **GitHub Actions**.
2. Add the custom domain `ditmesh.agentx.icu` and enable HTTPS after DNS is ready.
3. Point DNS with a CNAME: `ditmesh.agentx.icu CNAME agentx-icu.github.io.`
4. Push to `main` or run the **pages** workflow manually.

## Content updates

Edit both language spans when changing copy, then run
`python3 tools/build_lang_pages.py`. Feature claims should match the DitMesh README,
`doc/operations/NETWORK.md` and `site/privacy.md`.

## Licence

GPL-3.0, same as DitMesh. See [LICENSE](LICENSE).
