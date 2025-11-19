# Windows 用タスクデータ連携ツール PtuneSync

**PtuneSync** は、
**Obsidian プラグイン ptune-log** と
**スマホアプリ ptune（作業タイマー）** のために設計された
**Windows 専用のデータ連携ツール**です。

---

## 必要なもの

* Windows 11
* Google アカウント
* Obsidian（ptune-log プラグイン）
* スマホアプリ **ptune**

---

## なぜ PtuneSync が必要か

Obsidian（ptune-log）とスマホアプリ ptune を使う場合、
**Google Tasks と安全に連携するための Google OAuth 認証が必須**になります。

しかし、OAuth を自分で設定しようとすると、

* Google Cloud Console でプロジェクト作成
* OAuth クライアントID / シークレットの発行
* 同意画面の設定
* テストユーザー追加

など **非常に複雑な手順が必要**になります。

PtuneSync はこの作業をすべて肩代わりし、
**Windows PC のブラウザを用いた標準 OAuth フローを実行**して
認証とタスク連携をワンクリックで完結させます。

→ **PtuneSync を使うことで、面倒な Google API 設定を一切せずに
Obsidian とスマホアプリ ptune をそのまま連携できます。**

詳細は以下公式ドキュメントを参照してください。

---

## 📘 公式ドキュメント（推奨）

本プラグインのセットアップ手順・利用ガイド・機能詳細は  
全て以下の公式サイトに統合されています：

▶ https://ptune.getperf.net/

---

## 📝 ライセンス

MIT License

---

## 🐛 Issue / フィードバック

改善提案や不具合報告は GitHub Issue へお寄せください。
