# サイトマップと画像の更新

## 表示幅別の画像

`scripts/generate-responsive-images.cjs` は既存のWebPから480・800・1200・1600px幅を生成し、HTMLのsrcsetとsizesを更新します。元画像は残し、拡大表示や検索用メタデータは元画像を使用します。元画像より容量が大きくなる候補は採用しません。

Node.jsとsharpが必要です。通常の開発環境ではsharpをインストールしてから実行してください。

```sh
npm install --no-save --package-lock=false sharp
node scripts/generate-responsive-images.cjs
```

既にsharpがある環境では、BEYOND_SHARP_MODULEにそのモジュールのパスを指定できます。

## サイトマップの更新日

重要な本文・画像・リンクの変更後、コミット前に実行します。

```sh
node scripts/update-sitemap.cjs
```

変更中のページは実行日の日本時間の日付、変更のないページは参照する公開ファイルのGit履歴を使います。両サイトマップに同じページ更新日を設定します。`--date=YYYY-MM-DD`で重要な更新の実際の日付を指定できます。

著作権年の変更だけなど、検索向けの更新日を変える必要がない編集では実行しないでください。サイトマップは全ページを一律に最新日に書き換える運用にはしません。
