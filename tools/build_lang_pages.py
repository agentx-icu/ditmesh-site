#!/usr/bin/env python3
"""Generate the language-pinned pages en/index.html and zh/index.html.

index.html is the single source: it carries both languages and auto-detects
one at the site root. The pages under /en/ and /zh/ are the same page pinned
to one language, so each language has its own shareable, indexable URL.
Re-run after every edit to index.html:  python3 tools/build_lang_pages.py
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://ditmesh.agentx.icu/"
SRC_TITLE = "<title>DitMesh — Chat in Morse code</title>"
SRC_OG_TITLE = '<meta property="og:title" content="DitMesh — Chat in Morse code">'
SRC_OG_DESC = ('<meta property="og:description" content="A serverless Morse messenger over the Tox '
               'peer-to-peer network. No phone number, no account server, no text mode.">')

LANGS = {
    "en": {"html_lang": "en", "title": "DitMesh — Chat in Morse code"},
    "zh": {
        "html_lang": "zh-Hans",
        "title": "DitMesh — 用摩尔斯电码聊天",
        "og_title": "DitMesh — 用摩尔斯电码聊天",
        "og_description": "基于 Tox 点对点网络的无服务器摩尔斯电码聊天工具。无需手机号，没有账号服务器，也没有文字模式。",
        "description": "DitMesh 是基于 Tox 点对点网络的免费开源、无服务器摩尔斯电码聊天工具。用直键或双桨在单聊和群组网络中拍发，支持 Android、iOS、macOS、Linux 与 Windows。",
        "og_locale": "zh_CN",
        "ld_description": "基于 Tox 点对点网络的免费开源、无服务器摩尔斯电码聊天工具。用直键或双桨在单聊和群组网络中拍发。",
    },
}


def replace_once(text, old, new):
    if text.count(old) != 1:
        raise SystemExit(f"expected exactly one occurrence of: {old[:70]!r}")
    return text.replace(old, new)


def build(src, lang, cfg):
    out = replace_once(
        src,
        '<html lang="en" data-lang="en">',
        f'<html lang="{cfg["html_lang"]}" data-lang="{lang}" data-page-lang="{lang}" data-base="../">',
    )
    out = replace_once(out, SRC_TITLE, f"<title>{cfg['title']}</title>")
    if cfg.get("description"):
        head, rest = out.split('<meta name="description" content="', 1)
        _, rest = rest.split('">', 1)
        out = f'{head}<meta name="description" content="{cfg["description"]}">{rest}'
    if cfg.get("og_title"):
        out = replace_once(out, SRC_OG_TITLE, f'<meta property="og:title" content="{cfg["og_title"]}">')
        out = replace_once(out, SRC_OG_DESC, f'<meta property="og:description" content="{cfg["og_description"]}">')
    if cfg.get("og_locale"):
        out = replace_once(out, '<meta property="og:type" content="website">',
                           f'<meta property="og:type" content="website">\n<meta property="og:locale" content="{cfg["og_locale"]}">')
    out = replace_once(out, f'<link rel="canonical" href="{SITE}">', f'<link rel="canonical" href="{SITE}{lang}/">')
    out = replace_once(out, f'<meta property="og:url" content="{SITE}">', f'<meta property="og:url" content="{SITE}{lang}/">')
    out = replace_once(out, f'content="{SITE}assets/img/en/og.jpg"', f'content="{SITE}assets/img/{lang}/og.jpg"')
    # Structured data: this page's URL, language and screenshot.
    out = replace_once(out, f'"url": "{SITE}"', f'"url": "{SITE}{lang}/"')
    out = replace_once(out, '"inLanguage": "en"', f'"inLanguage": "{cfg["html_lang"]}"')
    out = replace_once(out, f'"screenshot": "{SITE}assets/img/en/og.jpg"', f'"screenshot": "{SITE}assets/img/{lang}/og.jpg"')
    if cfg.get("ld_description"):
        out = re.sub(r'("description": ")[^"]*(")', lambda m: m[1] + cfg["ld_description"] + m[2], out, count=1)
    # Relative URLs move one directory down.
    for attr in ("href", "src"):
        out = out.replace(f'{attr}="assets/', f'{attr}="../assets/')
    out = out.replace('href="en/"', 'href="../en/"').replace('href="zh/"', 'href="../zh/"')
    # Ship the right screenshots in the HTML itself so there is no swap after load.
    out = out.replace('src="../assets/img/en/', f'src="../assets/img/{lang}/')
    if lang != "en":
        # Alt text and aria labels are swapped by main.js; bake them in so
        # crawlers and no-JavaScript visitors get the pinned language too.
        out = re.sub(r'(data-alt-' + lang + r'="([^"]*)"\s+)alt="[^"]*"',
                     lambda m: f'{m[1]}alt="{m[2]}"', out)
        out = re.sub(r'(data-aria-en="[^"]*" data-aria-' + lang + r'="([^"]*)") aria-label="[^"]*"',
                     lambda m: f'{m[1]} aria-label="{m[2]}"', out)
    banner = "<!-- Generated from ../index.html by tools/build_lang_pages.py. Do not edit. -->\n"
    return replace_once(out, "<!doctype html>\n", "<!doctype html>\n" + banner)


def main():
    src = (ROOT / "index.html").read_bytes().decode("utf-8")
    for lang, cfg in LANGS.items():
        dest = ROOT / lang / "index.html"
        dest.parent.mkdir(exist_ok=True)
        dest.write_bytes(build(src, lang, cfg).encode("utf-8"))
        print(f"wrote {dest.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
