# myot.jp

ECOMジュニア 英検グループクラスのサイト（Astro の静的サイトを Cloudflare Workers で配信）。

- ページ: `src/content/pages/`（Markdown。`path` がサイトのルートからの URL）
- お知らせ: `src/content/news/`（旧サイトと同じくルート直下の URL）
- トップページ: `src/pages/index.astro`
- メニュー: `src/components/Nav.ts`
- 旧 WordPress からの転送: `public/_redirects`（会員・予約・カートなどの廃止ページはトップへ、/contact/ は会社サイトの問い合わせフォームへ）

フォームや会員機能はないので、Worker の変数やシークレットの設定は不要です。

```sh
npm install
npm run dev      # http://localhost:4321/
npm run build    # dist/ に出力
npm run preview  # ビルドして wrangler dev で本番と同じ配信を確認
```

Cloudflare の Worker（Git 接続）の設定は、ビルドコマンド `npm run build`、デプロイコマンド `npx wrangler deploy`。
