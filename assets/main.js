(() => {
  'use strict';

  const REPO = 'agentx-icu/ditmesh';
  const RELEASES = 'https://github.com/' + REPO + '/releases';

  // Checked-in release used before (or instead of, when GitHub is unreachable)
  // the live lookup below. The static links in index.html point at the same
  // release, so no-JavaScript visitors get identical downloads. Update both
  // after each DitMesh release, then run tools/build_lang_pages.py.
  const FALLBACK = {
    tag_name: 'v1.0.1',
    name: 'DitMesh v1.0.1',
    published_at: '2026-10-11T01:57:35Z',
    assets: [
      ['ditmesh-1.0.1-android.aab', 74863300, '44dc1d949b3d398d68624a567d1baa14fe141315ac9510f73d9f91cdbfcd9ab5'],
      ['ditmesh-1.0.1-android.apk', 110594476, 'c9d0dbb11809a7456e7570171cb8d36024877da945529ce574a81b49e10cd833'],
      ['ditmesh-1.0.1-ios-unsigned.ipa', 13284701, 'f50bc6dd7c56ab867c7f9033223979187ef0d2c33a1f31297b2a3b967ef7303c'],
      ['ditmesh-1.0.1-linux-x86_64.deb', 17787620, '086b0fc3a945a69119fd70d7cc2080951e3b54d6140394392b2d96c88bf2d8e8'],
      ['ditmesh-1.0.1-linux-x86_64.rpm', 12475345, '2f8e970e4407c17afdb84f55876fd35afc74ed5642ff4d87df2d07a611012120'],
      ['ditmesh-1.0.1-linux-x86_64.tar.gz', 24992218, '8e58ea16160634756a6e4a19fc46095903c6511f775efe59f67d01e571783b14'],
      ['ditmesh-1.0.1-macos-arm64.pkg', 14915383, '507a9b10c5a98cf318cf7835eef91e287baad3bc8b09fa91df1a6043c9cdb07d'],
      ['ditmesh-1.0.1-macos-arm64.zip', 14992265, '2d6e454e8baf60a24bc42fe840505df66bc184873d3ff022d49cf072b8585643'],
      ['ditmesh-1.0.1-macos-x86_64.pkg', 16128342, 'ff64394bfdd3c30f11fc505c49ae58d4b5b8ad9d5e845137e84183667d03cc09'],
      ['ditmesh-1.0.1-macos-x86_64.zip', 16206757, '5b4eb55d9ec9636528b284d2e25fdf52cd741863302fa3387ef1b95165b3f7bb'],
      ['ditmesh-1.0.1-windows-x64.msi', 18722816, 'd5399f8755ae4691b4f0e55e384228198740d505d5b19f98efed3cfb88c6c300'],
      ['ditmesh-1.0.1-windows-x64.zip', 17843231, '552241c455aa59401f5ac1649de32ff70d37e9c70090a7fb4a8ab1150f0eb13e'],
      ['SHA256SUMS', 1153, '']
    ].map(([name, size, sha]) => ({
      name, size,
      digest: sha ? 'sha256:' + sha : '',
      browser_download_url: RELEASES + '/download/v1.0.1/' + name
    }))
  };

  const root = document.documentElement;
  // Pages under /en/ and /zh/ are pinned to one language and sit one level deep.
  const pageLang = root.getAttribute('data-page-lang');
  const base = root.getAttribute('data-base') || '';
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const lang = () => (root.getAttribute('data-lang') === 'zh' ? 'zh' : 'en');
  const t = (en, zh) => (lang() === 'zh' ? zh : en);

  /* ---------------- language ---------------- */

  const TITLES = {
    en: 'DitMesh — Chat in Morse code',
    zh: 'DitMesh — 用摩尔斯电码聊天'
  };

  const applyLang = l => {
    root.setAttribute('data-lang', l);
    root.lang = l === 'zh' ? 'zh-Hans' : 'en';
    document.title = TITLES[l];
    $$('img[data-shot]').forEach(img => {
      const src = base + 'assets/img/' + l + '/' + img.getAttribute('data-shot');
      if (img.getAttribute('src') !== src) img.setAttribute('src', src);
    });
    $$('[data-alt-en]').forEach(el => el.setAttribute('alt', el.getAttribute('data-alt-' + l)));
    $$('[data-aria-en]').forEach(el => el.setAttribute('aria-label', el.getAttribute('data-aria-' + l)));
    // Re-render release text so notes such as "Not in this release" follow the language.
    if (lastRelease) updateRelease(lastRelease); else renderHero();
  };

  const langButton = document.getElementById('langBtn');
  if (langButton) langButton.addEventListener('click', () => {
    const next = lang() === 'zh' ? 'en' : 'zh';
    try { localStorage.setItem('ditmesh-lang', next); } catch (e) {}
    if (pageLang) { location.href = base + next + '/' + location.hash; return; }
    applyLang(next);
  });

  /* ---------------- tabs ---------------- */

  $$('[role=tablist]').forEach(list => {
    const tabs = $$('[role=tab]', list);
    const select = tab => tabs.forEach(x => {
      const on = x === tab;
      x.setAttribute('aria-selected', on ? 'true' : 'false');
      x.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(x.getAttribute('aria-controls'));
      if (panel) panel.hidden = !on;
    });
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(tab));
      tab.addEventListener('keydown', e => {
        const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        const n = tabs[(i + d + tabs.length) % tabs.length];
        select(n); n.focus(); e.preventDefault();
      });
    });
    list._select = key => {
      const tab = tabs.find(x => x.getAttribute('data-key') === key);
      if (tab) select(tab);
    };
  });

  /* ---------------- copy ---------------- */

  const toast = $('.toast');
  let toastTimer = 0;
  const flash = msg => {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1600);
  };
  const copyText = text => {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) {} finally { ta.remove(); }
    return ok ? Promise.resolve() : Promise.reject(new Error('copy failed'));
  };
  $$('.term').forEach(term => {
    const b = document.createElement('button');
    b.className = 'copy'; b.type = 'button'; b.textContent = 'copy';
    b.addEventListener('click', () => {
      const clone = term.cloneNode(true);
      $$('.copy', clone).forEach(x => x.remove());
      // Drop comment lines so the copied text pastes straight into a shell.
      const lines = clone.textContent.split('\n').filter(l => l.trim() && l.trim().charAt(0) !== '#');
      copyText(lines.join('\n')).then(
        () => flash(t('Copied', '已复制')),
        () => flash(t("Couldn't copy, select the text instead", '复制失败，请手动选择文本')));
    });
    term.appendChild(b);
  });

  /* ---------------- Morse tape ---------------- */

  const MORSE = {
    A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..',
    J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.',
    S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..'
  };
  const tape = document.getElementById('tape');
  if (tape) {
    const marks = [];
    tape.textContent = '';
    'CQ CQ DE DITMESH K'.split(' ').forEach((word, wi) => {
      if (wi) tape.appendChild(Object.assign(document.createElement('span'), { className: 'wgap' }));
      word.split('').forEach((ch, ci) => {
        if (ci) tape.appendChild(Object.assign(document.createElement('span'), { className: 'gap' }));
        MORSE[ch].split('').forEach(sym => {
          const m = document.createElement('span');
          m.className = 'm ' + (sym === '.' ? 'dit' : 'dah');
          tape.appendChild(m);
          marks.push(m);
        });
      });
    });
    const still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!still && marks.length) {
      // Light each mark for one (dit) or three (dah) units, roughly 15 WPM.
      let i = 0;
      const step = () => {
        const m = marks[i];
        m.classList.add('on');
        const unit = 80;
        setTimeout(() => {
          m.classList.remove('on');
          i = (i + 1) % marks.length;
          setTimeout(step, i === 0 ? unit * 14 : unit * 2);
        }, m.classList.contains('dah') ? unit * 3 : unit);
      };
      setTimeout(step, 900);
    }
  }

  /* ---------------- platform detection ---------------- */

  const plat = (() => {
    const ua = navigator.userAgent || '';
    const p = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '';
    let os = null;
    if (/android/i.test(ua)) os = 'android';
    else if (/iphone|ipad|ipod/i.test(ua) || (/Mac/.test(p) && navigator.maxTouchPoints > 1)) os = 'ios';
    else if (/win/i.test(p) || /windows/i.test(ua)) os = 'windows';
    else if (/mac/i.test(p)) os = 'macos';
    else if (/linux|x11|cros/i.test(p + ua)) os = 'linux';
    return { os, arch: null };
  })();

  if (plat.os) {
    const card = document.getElementById('os-' + plat.os);
    if (card) card.classList.add('hl');
    const guide = document.getElementById('guideTabs');
    if (guide && guide._select) guide._select(plat.os);
  }
  // Chromium exposes the CPU architecture; Safari and Firefox do not, so a Mac
  // with an unknown CPU is sent to the macOS card rather than guessed.
  if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
    navigator.userAgentData.getHighEntropyValues(['architecture']).then(v => {
      if (v.architecture === 'arm' || v.architecture === 'x86') plat.arch = v.architecture;
      renderHero();
    }).catch(() => {});
  }

  /* ---------------- release data ---------------- */

  let lastRelease = null;
  let current = null;  // { tag, date, bySuffix: Map(suffix -> asset|null) }

  const sizeText = bytes => {
    if (!bytes) return '';
    if (bytes < 1048576) return Math.max(1, Math.round(bytes / 1024)) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const setUnavailable = link => {
    link.removeAttribute('href');
    link.setAttribute('aria-disabled', 'true');
    link.classList.add('is-unavailable');
    const note = t('Not in this release', '此版本未提供');
    link.title = note;
    const size = $('.ps', link);
    if (size) size.textContent = note;
  };
  const setAvailable = (link, asset) => {
    link.href = asset.browser_download_url;
    link.removeAttribute('aria-disabled');
    link.classList.remove('is-unavailable');
    link.removeAttribute('title');
    const file = $('.pf', link);
    if (file) file.textContent = asset.name;
    const size = $('.ps', link);
    if (size) size.textContent = sizeText(asset.size);
  };

  const HERO = {
    'macos-arm64.pkg': ['Download for macOS (Apple silicon)', '下载 macOS 版（Apple 芯片）'],
    'macos-x86_64.pkg': ['Download for macOS (Intel)', '下载 macOS 版（Intel）'],
    'windows-x64.msi': ['Download for Windows', '下载 Windows 版'],
    'linux-x86_64.deb': ['Download for Linux (.deb)', '下载 Linux 版（.deb）'],
    'android.apk': ['Download for Android', '下载 Android 版']
  };
  const heroSuffix = () => {
    switch (plat.os) {
      case 'macos': return plat.arch === 'arm' ? 'macos-arm64.pkg' : plat.arch === 'x86' ? 'macos-x86_64.pkg' : null;
      case 'windows': return 'windows-x64.msi';
      case 'linux': return 'linux-x86_64.deb';
      case 'android': return 'android.apk';
      default: return null;
    }
  };

  function renderHero() {
    const hero = document.getElementById('heroDl');
    if (!hero || !current) return;
    const label = $('.hero-dl-label', hero);
    const sub = $('.hero-dl-sub', hero);
    const suffix = heroSuffix();
    const asset = suffix && current.bySuffix.get(suffix);
    if (asset) {
      hero.href = asset.browser_download_url;
      label.textContent = t(HERO[suffix][0], HERO[suffix][1]);
      sub.textContent = current.tag + ' · ' + sizeText(asset.size);
      return;
    }
    if (plat.os === 'macos' || plat.os === 'ios') {
      hero.href = '#os-' + plat.os;
      label.textContent = plat.os === 'macos'
        ? t('Download for macOS', '下载 macOS 版')
        : t('Getting DitMesh on iOS', 'iOS 版本获取方式');
      sub.textContent = current.tag + (plat.os === 'macos' ? t(' · Apple silicon / Intel', ' · Apple 芯片 / Intel') : '');
      return;
    }
    hero.href = '#download';
    label.textContent = t('Download DitMesh', '下载 DitMesh');
    sub.textContent = current.tag + t(' · all platforms', ' · 全部平台');
  }

  // Asset names carry the release version (ditmesh-1.0.1-macos-arm64.pkg), so
  // links match a stable suffix instead of hard-coding the version. A release
  // must have exactly one asset per suffix; a missing or ambiguous suffix
  // disables that link rather than leaving it on an older release's file.
  const updateRelease = release => {
    const tag = release.tag_name || FALLBACK.tag_name;
    const encodedTag = encodeURIComponent(tag);
    const assets = Array.isArray(release.assets)
      ? release.assets.filter(a => a && typeof a.name === 'string' && typeof a.browser_download_url === 'string')
      : [];
    const bySuffix = new Map();
    const find = suffix => {
      if (!bySuffix.has(suffix)) {
        const matches = assets.filter(a => a.name.toLowerCase().endsWith(suffix.toLowerCase()));
        bySuffix.set(suffix, matches.length === 1 ? matches[0] : null);
      }
      return bySuffix.get(suffix);
    };

    $$('[data-asset]').forEach(link => {
      const asset = find(link.dataset.asset);
      if (asset) setAvailable(link, asset); else setUnavailable(link);
    });
    // Install commands must not keep naming the checked-in package under a
    // newer version heading, so a missing package becomes a placeholder.
    $$('[data-file]').forEach(el => {
      const asset = find(el.getAttribute('data-file'));
      el.textContent = asset ? asset.name : '<' + el.getAttribute('data-file') + '>';
    });
    Object.keys(HERO).forEach(find);

    const sums = assets.find(a => a.name.toUpperCase() === 'SHA256SUMS');
    const sumsLink = document.getElementById('sumsLink');
    if (sumsLink) {
      if (sums) setAvailable(sumsLink, sums); else setUnavailable(sumsLink);
    }
    const sumsBox = document.getElementById('sums');
    if (sumsBox) {
      const rows = assets
        .filter(a => a !== sums)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(a => {
          const sha = typeof a.digest === 'string' && a.digest.indexOf('sha256:') === 0 ? a.digest.slice(7) : '';
          return (sha || '(see SHA256SUMS)') + '  ' + a.name;
        });
      sumsBox.textContent = rows.join('\n');
    }

    const date = String(release.published_at || '').slice(0, 10);
    $$('[data-version]').forEach(el => { el.textContent = tag; });
    if (date) $$('[data-release-date]').forEach(el => { el.textContent = date; });
    $$('[data-release-link]').forEach(el => {
      el.href = RELEASES + '/tag/' + encodedTag;
      el.title = release.name || tag;
    });

    lastRelease = release;
    current = { tag, date, bySuffix };
    renderHero();
  };

  updateRelease(FALLBACK);
  applyLang(pageLang || lang());

  // /releases/latest is GitHub's stable-release resolver. Unlike a paginated
  // release list it cannot select an older build or a prerelease.
  if (window.fetch) {
    fetch('https://api.github.com/repos/' + REPO + '/releases/latest', {
      headers: { Accept: 'application/vnd.github+json' }
    })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then(latest => {
        if (latest && !latest.draft && !latest.prerelease && latest.tag_name) updateRelease(latest);
      })
      .catch(() => { /* keep the checked-in fallback */ });
  }
})();
