(() => {
  const REPO = 'agentx-icu/ditmesh';
  // Keep a checked-in fallback for no-JavaScript visitors. If a newer release
  // is missing an expected package, do not leave its link pointing at this
  // older fallback while the release heading says something else.
  const FALLBACK_TAG = 'v1.0.0';
  const root = document.documentElement;
  const langButton = document.getElementById('langBtn');
  if (langButton) langButton.addEventListener('click', () => {
    const next = root.getAttribute('data-lang') === 'zh' ? 'en' : 'zh';
    root.setAttribute('data-lang', next);
    root.lang = next === 'zh' ? 'zh-CN' : 'en';
    try { localStorage.setItem('ditmesh-lang', next); } catch (e) {}
  });

  const suffixFor = (name, suffix) => name.toLowerCase().endsWith(suffix.toLowerCase());
  const sizeText = bytes => {
    if (!bytes) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    let n = bytes, i = 0;
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
    return ' · ' + (i ? n.toFixed(1) : n) + ' ' + units[i];
  };

  const setUnavailable = link => {
    link.removeAttribute('href');
    link.setAttribute('aria-disabled', 'true');
    link.classList.add('is-unavailable');
    link.title = 'This package is not available in this release';
    const old = link.querySelector('.asset-size');
    if (old) old.remove();
  };

  const updateRelease = (release, { fallback = false } = {}) => {
    const tag = release.tag_name || FALLBACK_TAG;
    const encodedTag = encodeURIComponent(tag);
    const base = 'https://github.com/' + REPO + '/releases/download/' + encodedTag + '/';
    const page = 'https://github.com/' + REPO + '/releases/tag/' + encodedTag;
    const relLink = document.getElementById('relLink');
    const relName = document.getElementById('relName');
    const relDate = document.getElementById('relDate');
    if (relLink) { relLink.href = page; relLink.title = release.name || tag; }
    if (relName) relName.textContent = tag;
    if (relDate && release.published_at) {
      relDate.textContent = new Date(release.published_at).toLocaleDateString();
    }

    const assets = release.assets || [];
    const sums = assets.find(a => a.name.toUpperCase() === 'SHA256SUMS');
    const sumsLink = document.getElementById('sumsLink');
    if (sumsLink) {
      if (sums && sums.browser_download_url) {
        sumsLink.href = sums.browser_download_url;
        sumsLink.removeAttribute('aria-disabled');
        sumsLink.classList.remove('is-unavailable');
        sumsLink.removeAttribute('title');
      } else if (fallback) {
        sumsLink.href = base + 'SHA256SUMS';
      } else {
        setUnavailable(sumsLink);
      }
    }

    // Asset names currently include the release version (for example
    // ditmesh-1.0.0-macos-arm64.pkg), so match by stable suffix rather than
    // hard-coding that version. This keeps links valid for future releases.
    document.querySelectorAll('[data-asset]').forEach(link => {
      const suffix = link.dataset.asset;
      // A release should have one unambiguous asset for each suffix. If it
      // does not, mark the link unavailable rather than selecting a similarly
      // named package or retaining the v1.0.0 fallback URL.
      const matches = assets.filter(a => suffixFor(a.name, suffix));
      const asset = matches.length === 1 ? matches[0] : null;
      if (!asset || !asset.browser_download_url) {
        if (!fallback) setUnavailable(link);
        return;
      }
      link.href = asset.browser_download_url;
      link.removeAttribute('aria-disabled');
      link.classList.remove('is-unavailable');
      link.removeAttribute('title');
      const old = link.querySelector('.asset-size');
      if (old) old.remove();
      const size = document.createElement('small');
      size.className = 'asset-size muted-in';
      size.textContent = sizeText(asset.size);
      link.appendChild(size);
    });
  };

  const fallbackAssets = [
    'ditmesh-1.0.0-android.aab', 'ditmesh-1.0.0-android.apk',
    'ditmesh-1.0.0-ios-unsigned.ipa', 'ditmesh-1.0.0-linux-x86_64.deb',
    'ditmesh-1.0.0-linux-x86_64.rpm', 'ditmesh-1.0.0-linux-x86_64.tar.gz',
    'ditmesh-1.0.0-macos-arm64.pkg', 'ditmesh-1.0.0-macos-arm64.zip',
    'ditmesh-1.0.0-macos-x86_64.pkg', 'ditmesh-1.0.0-macos-x86_64.zip',
    'ditmesh-1.0.0-windows-x64.msi', 'ditmesh-1.0.0-windows-x64.zip', 'SHA256SUMS'
  ];
  updateRelease({
    tag_name: FALLBACK_TAG,
    name: 'DitMesh v1.0.0',
    published_at: '2026-10-10T13:27:57Z',
    assets: fallbackAssets.map(name => ({
      name,
      browser_download_url: 'https://github.com/' + REPO + '/releases/download/' +
        FALLBACK_TAG + '/' + name
    }))
  }, { fallback: true });

  // /releases/latest is GitHub's stable-release resolver. Unlike a paginated
  // release list it cannot accidentally select an older or prerelease build.
  fetch('https://api.github.com/repos/' + REPO + '/releases/latest', {
    headers: { Accept: 'application/vnd.github+json' }
  })
    .then(r => r.ok ? r.json() : Promise.reject(new Error(r.status)))
    .then(latest => { if (latest && !latest.draft && !latest.prerelease) updateRelease(latest); })
    .catch(() => {});
})();
