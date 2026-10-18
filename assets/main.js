(() => {
  'use strict';

  const REPO = 'agentx-icu/ditmesh';
  const RELEASES = 'https://github.com/' + REPO + '/releases';

  // Checked-in release used before (or instead of, when GitHub is unreachable)
  // the live lookup below. The static links in index.html point at the same
  // release, so no-JavaScript visitors get identical downloads. Update both
  // after each DitMesh release, then run tools/build_lang_pages.py.
  const FALLBACK = {
    tag_name: 'v1.1.0',
    name: 'DitMesh v1.1.0',
    published_at: '2026-10-18T07:05:21Z',
    assets: [
      ['SHA256SUMS', 1153, ''],
      ['ditmesh-1.1.0-android.aab', 75282338, 'eff9e3ada16b1d5acbc09aa1a0b944161114dc58d088cda5f32547355e3d194a'],
      ['ditmesh-1.1.0-android.apk', 111742132, 'a06ad805035f6a042b1ba6a67402efa9230043d1ef072805458b8d9545f86459'],
      ['ditmesh-1.1.0-ios-unsigned.ipa', 13443748, '5708ee4bb0e0be0c97040f2e6807d3a7884b49e45cd7eb0426cba5940424976c'],
      ['ditmesh-1.1.0-linux-x86_64.deb', 17889750, '813dbe8edcac4d1f23b5525afe684f3f3c463c9e7291b93e9900e87cf2733199'],
      ['ditmesh-1.1.0-linux-x86_64.rpm', 12575145, 'f57ab210b22a9a9c999c1486688f2c62153f2ecd6ce3ab4f36551d36c3af2dd8'],
      ['ditmesh-1.1.0-linux-x86_64.tar.gz', 25145079, 'e093f8a8ec5b3bffc48e9224f32968d4f458d12a4f97c50bda3dbfbc9ca6ee58'],
      ['ditmesh-1.1.0-macos-arm64.pkg', 15072516, '64bafeefe8eb3c991ebad0010f4541a18de08abbd308a7a4a2891aa209c84a6d'],
      ['ditmesh-1.1.0-macos-arm64.zip', 15146885, 'e449025e972654d22c60aee775012bc68ef414806df132e1cf92af7e9a16c948'],
      ['ditmesh-1.1.0-macos-x86_64.pkg', 16285958, 'f9bec768d1adb5a11065adda8329bee88b120f648eb20b4e61318b45dfa57970'],
      ['ditmesh-1.1.0-macos-x86_64.zip', 16364721, 'c3f467d9cac05d52418ee890439a3800dfba4777956b55043ea965cbc2bdc6af'],
      ['ditmesh-1.1.0-windows-x64.msi', 18874368, '15ff6a499fded8974ff3766fda863808a05d9265fd7742975ac5a6df798a9bdb'],
      ['ditmesh-1.1.0-windows-x64.zip', 17988515, 'e3f378873d991367d2730c004a7282a1e477779466ea5f64d63d72cc0c23737e']
    ].map(([name, size, sha]) => ({
      name, size,
      digest: sha ? 'sha256:' + sha : '',
      browser_download_url: RELEASES + '/download/v1.1.0/' + name
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

  /* ---------------- mobile menu ---------------- */

  // Below 1060px the section links fold into a menu button.
  const nav = $('.nav');
  const menuBtn = document.getElementById('menuBtn');
  if (nav && menuBtn) {
    const setMenu = open => {
      nav.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    menuBtn.hidden = false;
    menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
    $$('#navLinks a').forEach(a => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('click', e => { if (!nav.contains(e.target)) setMenu(false); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); menuBtn.focus(); }
    });
    matchMedia('(min-width: 1061px)').addEventListener('change', () => setMenu(false));
  }

  /* ---------------- screenshot viewer ---------------- */

  // Screenshots open full size in a <dialog>; arrows and swipes step through
  // the group (one gallery pane or one feature figure) the image belongs to.
  const shots = $$('.gallery img, .duo img, .phone-duo img');
  if (shots.length && window.HTMLDialogElement) {
    const box = document.createElement('dialog');
    box.className = 'lightbox';
    box.innerHTML = '<figure><img alt=""><figcaption></figcaption></figure>' +
      '<button type="button" class="lb-btn lb-close">×</button>' +
      '<button type="button" class="lb-btn lb-prev">‹</button><button type="button" class="lb-btn lb-next">›</button>';
    document.body.appendChild(box);
    const boxImg = $('img', box);
    const boxCap = $('figcaption', box);
    let group = [];
    let at = 0;
    // The caption is the image's alt text, or else its figure's visible caption.
    const caption = img => {
      const cap = img.closest('figure') && $('figcaption', img.closest('figure'));
      return img.alt || (cap ? cap.innerText.trim() : '');
    };
    const show = i => {
      at = (i + group.length) % group.length;
      boxImg.src = group[at].currentSrc || group[at].src;
      boxImg.alt = caption(group[at]);
      boxCap.textContent = boxImg.alt;
      box.classList.toggle('single', group.length < 2);
    };
    const step = d => { if (group.length > 1) show(at + d); };
    shots.forEach((img, n) => {
      img.tabIndex = 0;
      img.setAttribute('role', 'button');
      // Gallery images have an empty alt, so name the button after the figure caption.
      const fig = img.closest('figure');
      const cap = fig && $('figcaption', fig);
      if (!img.alt && cap) {
        if (!cap.id) cap.id = 'shot-cap-' + n;
        img.setAttribute('aria-labelledby', cap.id);
      }
      const open = () => {
        group = $$('img', img.closest('.gallery, .duo, .phone-duo'));
        show(group.indexOf(img));
        $('.lb-close', box).setAttribute('aria-label', t('Close', '关闭'));
        $('.lb-prev', box).setAttribute('aria-label', t('Previous', '上一张'));
        $('.lb-next', box).setAttribute('aria-label', t('Next', '下一张'));
        box.showModal();
      };
      img.addEventListener('click', open);
      img.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      });
    });
    $('.lb-close', box).addEventListener('click', () => box.close());
    $('.lb-prev', box).addEventListener('click', () => step(-1));
    $('.lb-next', box).addEventListener('click', () => step(1));
    box.addEventListener('click', e => { if (e.target === box || e.target.tagName === 'FIGURE') box.close(); });
    box.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
    });
    let x0 = null;
    box.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', e => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
    });
  }

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

  // Asset names carry the release version (ditmesh-1.1.0-macos-arm64.pkg), so
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
