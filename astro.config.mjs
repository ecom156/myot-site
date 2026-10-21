// @ts-check
import { defineConfig } from 'astro/config';

// フォームも会員機能もないので完全な静的サイト。dist/ を Cloudflare Workers の静的アセットとして配信する
export default defineConfig({
  site: 'https://myot.jp',
  trailingSlash: 'ignore',
});
