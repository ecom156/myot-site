// WordPress (myot.jp) から固定ページ・お知らせ・画像を取り込む一回限りのスクリプト。
// 使い方: node scripts/import-wordpress.mjs <REST API の JSON と表示 HTML を置いたディレクトリ>
//   full_pages.json … /wp-json/wp/v2/pages?per_page=100 のうち移行するページ
//   posts.json      … /wp-json/wp/v2/posts?per_page=100
//   html/<id>.html  … 各ページの表示 HTML（WPBakery のショートコードが展開済みのもの）
import fs from 'node:fs';
import path from 'node:path';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

const SRC = process.argv[2];
const ROOT = path.resolve(import.meta.dirname, '..');
const ORIGIN = 'https://myot.jp';
const CONTACT = 'https://ecominc.co.jp/contact/';
// トップページは src/pages/index.astro で組むので取り込まない
const SKIP_PAGES = new Set([2]);

const readJson = (f) => JSON.parse(fs.readFileSync(path.join(SRC, f), 'utf8'));
const decode = (s) => {
  const t = s.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
  return t.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/&hellip;/g, '…');
};
const yaml = (s) => JSON.stringify(s);

const images = new Set();
const localize = (url) => {
  if (!url.startsWith(`${ORIGIN}/wp-content/uploads/`)) return url;
  images.add(url);
  return url.slice(ORIGIN.length);
};

const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-' });
td.use(gfm);
td.keep(['iframe']);
td.addRule('image', {
  filter: 'img',
  replacement: (_, node) => {
    // WordPress の遅延読み込みで src がダミー画像になっているので data-src を優先する
    const src = node.getAttribute('data-src') || node.getAttribute('src');
    if (!src || src.startsWith('data:')) return '';
    return `![${(node.getAttribute('alt') || '').replace(/[[\]]/g, '')}](${localize(src)})`;
  },
});
td.addRule('figcaption', {
  filter: 'figcaption',
  replacement: (content) => `\n\n*${content.trim()}*\n\n`,
});
// 予約・会員登録は廃止したので、ボタンはお問い合わせ（会社サイト）へ張り替え、文中のリンクは外す
const CLOSED = /^\/(lists|register)\//;
const INLINE = new Set(['必要な講座を選んで']);
td.addRule('internalLink', {
  filter: (node) => node.nodeName === 'A' && (node.getAttribute('href') || '').startsWith(ORIGIN),
  replacement: (content, node) => {
    const href = decodeURI(node.getAttribute('href').slice(ORIGIN.length));
    if (href.startsWith('/wp-content/uploads/')) return `[${content}](${localize(ORIGIN + href)})`;
    if (CLOSED.test(href)) return INLINE.has(node.textContent.trim()) ? content : `[お問い合わせはこちら](${CONTACT})`;
    return `[${content}](${href})`;
  },
});
// WPBakery の表をそのまま HTML で残すので、装飾用のクラスと空行を落とす
const cleanTables = (html) =>
  html.replace(/<table[\s\S]*?<\/table>/g, (t) =>
    t.replace(/<span class="vc_table_content">([\s\S]*?)<\/span>/g, '$1')
      .replace(/ class="[^"]*"/g, '')
      .replace(/<tr>(\s*<td>\s*<\/td>)+\s*<\/tr>/g, '')
      .replace(/ (srcset|sizes)="[^"]*"/g, '')
      .replace(/https:\/\/myot\.jp\/wp-content\/uploads\/[^"]+/g, localize));
const toMarkdown = (html) =>
  td.turndown(cleanTables(html).replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<noscript[\s\S]*?<\/noscript>/g, ''))
    .replace(/\n{3,}/g, '\n\n')
    .trim() + '\n';
const body = (id) => {
  const html = fs.readFileSync(path.join(SRC, 'html', `${id}.html`), 'utf8');
  const start = html.indexOf('<div class="czr-wp-the-content">');
  const end = html.indexOf('</section>', start);
  return toMarkdown(html.slice(start, end));
};
const urlPath = (link) => decodeURIComponent(new URL(link).pathname).replace(/^\/|\/$/g, '');

const pageDir = path.join(ROOT, 'src/content/pages');
fs.mkdirSync(pageDir, { recursive: true });
for (const p of readJson('full_pages.json')) {
  if (SKIP_PAGES.has(p.id)) continue;
  const md = body(p.id);
  // 子ページのまとめ役で本文が空のページは取り込まず、_redirects で子ページへ転送する
  if (!md.trim()) continue;
  const fm = [`title: ${yaml(decode(p.title.rendered))}`, `path: ${yaml(urlPath(p.link))}`];
  fs.writeFileSync(path.join(pageDir, `${urlPath(p.link).replace(/\//g, '--')}.md`), `---\n${fm.join('\n')}\n---\n\n${md}`);
}

const newsDir = path.join(ROOT, 'src/content/news');
fs.mkdirSync(newsDir, { recursive: true });
for (const p of readJson('posts.json')) {
  const fm = [
    `title: ${yaml(decode(p.title.rendered))}`,
    `path: ${yaml(urlPath(p.link))}`,
    `date: ${p.date.slice(0, 10)}`,
  ];
  fs.writeFileSync(path.join(newsDir, `${p.id}.md`), `---\n${fm.join('\n')}\n---\n\n${body(p.id)}`);
}

// ---- 画像（旧サイトと同じパスで配信する）
let ok = 0;
const failed = [];
for (const u of images) {
  const out = path.join(ROOT, 'public', decodeURIComponent(u.slice(ORIGIN.length)));
  if (fs.existsSync(out)) { ok++; continue; }
  fs.mkdirSync(path.dirname(out), { recursive: true });
  let done = false;
  for (let i = 0; i < 4 && !done; i++) {
    try {
      const res = await fetch(u);
      if (res.status === 404) break;
      if (!res.ok) throw new Error(String(res.status));
      fs.writeFileSync(out, Buffer.from(await res.arrayBuffer()));
      done = true;
    } catch {
      await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
    }
  }
  done ? ok++ : failed.push(u);
}
console.log(`images: ${ok} saved, ${failed.length} failed`);
for (const u of failed) console.log(`  missing: ${u}`);
