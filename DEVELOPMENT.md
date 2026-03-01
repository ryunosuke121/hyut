# 開発ガイド

hyut の開発に参加するための手順です。

## 必要な環境

- [Node.js](https://nodejs.org/) v18 以上
- [Rust](https://www.rust-lang.org/tools/install)
- macOS (Xcode Command Line Tools インストール済み)

## セットアップ

### 1. Rust のインストール

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
```

### 2. 依存パッケージのインストール

```bash
npm install
```

### 3. 開発サーバーの起動

```bash
npm run tauri dev
```

### 4. プロダクションビルド

```bash
npm run tauri build
```

ビルド成果物は `src-tauri/target/release/bundle/macos/hyut.app` に生成されます。

## 推奨エディタ設定

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
