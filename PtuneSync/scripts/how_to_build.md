PtuneSync を **素の Windows 11** からセットアップし、
**WinUI 3 + Windows App SDK アプリをビルド → パッケージ作成 → Microsoft Store 申請**
までを一通り実行するための最新手順を整理。

**対象構成：**

* WinUI 3 / .NET 7–8
* Windows App SDK 1.3 系（安定版推奨）
* Visual Studio 2022
* MSIX パッケージ作成
* カスタム URI スキーム（`windows.protocol`）対応
* ストア公開手順

---

## 1. Windows 11 の初期セットアップ

### 1-1. 必須コンポーネント

* Windows 11（22H2 以降推奨）
* 開発者モード ON
  Settings → For Developers → Developer Mode

### 1-2. 補助ツール

* Windows Terminal
* PowerShell 7.x
* Git for Windows
* .NET SDK（.NET 8 推奨）
  [https://dotnet.microsoft.com/download](https://dotnet.microsoft.com/download)

---

## 2. Visual Studio 2022 のインストール

### 2-1. 必須ワークロード

Visual Studio Installer → 以下を選択

* **「.NET デスクトップ開発」**（必須）
* **「ユニバーサル Windows プラットフォーム（UWP）開発」**
  → MSIX パッケージ署名・生成に必要
* **「C++ デスクトップ開発」**（C++/WinRT 基盤のため推奨）
* **「Windows App SDK」**
  （WinUI 3 テンプレートとビルドツール）

### 2-2. 個別コンポーネント（重要）

特に WinUI + MSIX ビルドでは以下の追加が必要

* Windows 10 SDK（10.0.22621.x 推奨）
* MSIX Packaging Tool
* .NET 8 SDK targeting pack
* .NET 7 targeting pack（互換性のため）

---

## 3. プロジェクト準備（PtuneSync）

### 3-1. ソース取得

```
git clone https://github.com/getperf/PtuneSync.git
cd PtuneSync
```

### 3-2. NuGet パッケージ復元

Visual Studio または CLI：

```
dotnet restore
```

### 3-3. Windows App SDK バージョン確認

`csproj` の記述：

```
<PackageReference Include="Microsoft.WindowsAppSDK" Version="1.3.230724000" />
```

※ バージョン変わる場合は VS が自動で修正を提案

---

## 4. ソリューションビルド

Visual Studio で

1. `PtuneSync.sln` を開く
2. 構成を **Release | x64** に変更
3. ビルド → ソリューションのビルド

正常に `PtuneSync.exe` が生成されれば OK

### 4-1. プロトコルハンドラの確認

Package.appxmanifest に以下があるため、
`net.getperf.ptune.googleoauth:/callback?...` をアプリ受信できる：

```xml
<uap:Extension Category="windows.protocol">
  <uap:Protocol Name="net.getperf.ptune.googleoauth">
```

※ Store 公開の際も **protocol は許可されるカテゴリ**

---

## 5. アプリパッケージ (.msix / .msixbundle) の作成

### 5-1. Visual Studio での手順

1. プロジェクトを右クリック
2. **Publish → Create App Packages…**
3. Store に公開するかを選ぶ

   * ※ 最初は「Store に公開しない」でローカル作成 → 動作確認がおすすめ
4. **Self-signed** の証明書を生成
5. `.msixbundle` を生成

### 5-2. ローカル実行の確認

PowerShell から：

```
Add-AppxPackage -Path .\PtuneSync_1.0.0.0_x64.msixbundle
```

---

## 6. 証明書（Publisher）設定

Publisher は manifest のこちら：

```xml
<Identity
  Name="PtuneSync"
  Publisher="CN=frsw3"
  Version="1.0.0.0" />
```

ストア申請時は **Store 側の Publisher ID に差し替える必要あり**

例：

* `CN=Your Publisher Name`
* Developer Portal 内で採番される

### 6-1. Store 向けに Publisher を自動反映

「パッケージ作成」ウィザード → Microsoft Store を選択 → アプリ名紐付け
→ Store の Publisher ID が自動挿入される

---

## 7. Microsoft Store への公開

### 7-1. 開発者アカウント

[https://partner.microsoft.com/](https://partner.microsoft.com/)

### 7-2. 新規アプリ登録

* アプリ名を予約
* パッケージ ID と Publisher ID が発行される
* Visual Studio の Create App Packages で連携

### 7-3. アップロード

提出物：

* `.msixupload` / `.appxupload`
* ストア説明
* スクリーンショット
* アプリアイコン（512px）

### 7-4. 検証

通常 1–3 日
プロトコルハンドラや runFullTrust 権限は追加レビューの可能性あり

```xml
<rescap:Capability Name="runFullTrust"/>
```

WinUI 3 のデスクトップアプリは **runFullTrust 必須** のため問題なし

---

## 8. Google OAuth プロトコルの動作確認

パッケージ化後でも以下 URL が起動できる必要

```
net.getperf.ptune.googleoauth:/auth?code=...
```

### 検証手順

PowerShell：

```
start "" "net.getperf.ptune.googleoauth:/test"
```

アプリが起動すれば OK

