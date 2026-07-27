# Cloudflare Workers 問い合わせフォーム設定

このサイトは、Cloudflare Workers Static Assets、Cloudflare Turnstile、Resendを使用します。

## 構成

- `worker.js`: `/api/contact` と `/api/turnstile-config` を処理
- `functions/api/contact.js`: 入力検証、Turnstile検証、Resend送信
- `functions/api/turnstile-config.js`: 公開用のTurnstileサイトキーを返す
- `wrangler.jsonc`: Workerと静的ファイル配信の設定
- `.assetsignore`: サーバーコードや設定資料の公開を防止

静的なHTMLはCloudflareの静的アセットとして配信し、`/api/*`へのリクエストだけWorkerを先に実行します。

## Cloudflareの変数とシークレット

Cloudflare Dashboardで対象Workerの「設定」→「変数とシークレット」から設定します。

| 名前 | 種別 | 内容 |
| --- | --- | --- |
| `TURNSTILE_SITE_KEY` | 変数 | Turnstileのサイトキー |
| `TURNSTILE_SECRET_KEY` | シークレット | Turnstileのシークレットキー |
| `RESEND_API_KEY` | シークレット | ResendのAPIキー |
| `CONTACT_TO_EMAIL` | 変数 | 問い合わせの受信先 |
| `CONTACT_FROM_EMAIL` | 変数 | `Beyond CG Studio <contact@example.com>`形式の送信元 |
| `ALLOWED_HOSTNAME` | 変数 | `lp.beyondinfo856.workers.dev`（`https://`や末尾の`/`は不要） |

シークレットはHTML、Git、`wrangler.jsonc`へ保存しないでください。

## デプロイ

Git連携の本番ブランチを`main`、デプロイコマンドを`npx wrangler deploy`、ルートディレクトリを`/`に設定します。

`main`へプッシュすると、`wrangler.jsonc`を使ってWorkerコードと静的ファイルが一緒にデプロイされます。既にDashboardで登録済みの変数とシークレットが実行時に使用されます。

## 動作確認

1. 新しいデプロイが成功したことをCloudflareの「デプロイ」で確認します。
2. `https://lp.beyondinfo856.workers.dev/api/turnstile-config` を開き、`siteKey`が返ることを確認します。
3. 公開ページを再読み込みし、Turnstileが表示されることを確認します。
4. フォームを送信し、完了メッセージと受信メールを確認します。
5. 受信メールの「返信」を押し、入力された問い合わせ元メールアドレスが返信先になることを確認します。

## Resendの注意点

Resendのテスト用送信元`onboarding@resend.dev`には送信先の制限があります。本番運用では所有ドメインをResendで認証し、`CONTACT_FROM_EMAIL`をそのドメインのアドレスへ変更してください。
