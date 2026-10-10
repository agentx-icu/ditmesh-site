(() => {
  const REPO = 'agentx-icu/ditmesh';
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
    const units = ['B','KB','MB','GB']; let n = bytes, i = 0;
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
    return ' · ' + (i ? n.toFixed(1) : n) + ' ' + units[i];
  };
  const updateRelease = release => {
    const tag = release.tag_name || FALLBACK_TAG;
    const base = 'https://github.com/' + REPO + '/releases/download/' + encodeURIComponent(tag) + '/';
    const page = 'https://github.com/' + REPO + '/releases/tag/' + encodeURIComponent(tag);
    const relLink = document.getElementById('relLink');
    const relName = document.getElementById('relName');
    const relDate = document.getElementById('relDate');
    if (relLink) { relLink.href = page; relLink.title = release.name || tag; }
    if (relName) relName.textContent = tag;
    if (relDate && release.published_at) relDate.textContent = new Date(release.published_at).toLocaleDateString();
    const sums = (release.assets || []).find(a => a.name === 'SHA256SUMS');
    const sumsLink = document.getElementById('sumsLink');
    if (sumsLink) sumsLink.href = sums ? sums.browser_download_url : base + 'SHA256SUMS';
    document.querySelectorAll('[data-asset]').forEach(link => {
      const suffix = link.dataset.asset;
      const asset = (release.assets || []).find(a => suffixFor(a.name, suffix));
      if (!asset) return;
      link.href = asset.browser_download_url;
      const old = link.querySelector('.asset-size');
      if (old) old.remove();
      const size = document.createElement('small');
      size.className = 'asset-size muted-in';
      size.textContent = sizeText(asset.size);
      link.appendChild(size);
    });
  };
  const fallback = {
    tag_name: FALLBACK_TAG,
    name: 'DitMesh v1.0.0',
    published_at: '2026-10-10T13:27:57Z',
    assets: [
      'ditmesh-1.0.0-android.aab','ditmesh-1.0.0-android.apk','ditmesh-1.0.0-ios-unsigned.ipa',
      'ditmesh-1.0.0-linux-x86_64.deb','ditmesh-1.0.0-linux-x86_64.rpm','ditmesh-1.0.0-linux-x86_64.tar.gz',
      'ditmesh-1.0.0-macos-arm64.pkg','ditmesh-1.0.0-macos-arm64.zip','ditmesh-1.0.0-macos-x86_64.pkg',
      'ditmesh-1.0.0-macos-x86_64.zip','ditmesh-1.0.0-windows-x64.msi','ditmesh-1.0.0-windows-x64.zip','SHA256SUMS'
    ].map(name => ({ name, browser_download_url: 'https://github.com/' + REPO + '/releases/download/' + FALLBACK_TAG + '/' + name }));
  };
  updateRelease(fallback);
  fetch('https://api.github.com/repos/' + REPO + '/releases?per_page=10', { headers: { Accept: 'application/vnd.github+json' } })
    .then(r => r.ok ? r.json() : Promise.reject(new Error(r.status)))
    .then(list => { const latest = list.find(r => !r.draft && !r.prerelease); if (latest) updateRelease(latest); })
    .catch(() => {});
})();
