# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

hyut は macOS 向けメモアプリ。Tauri v2 + React 19 + TypeScript で構築。Raycast Memo の快適な操作感（グローバルショートカットでポップアップ起動、WYSIWYG Markdown）を再現しつつ、ドキュメント数制限のないローカル保存を実現する。メモは `~/hyut/` に YAML frontmatter 付き `.md` ファイルとして保存。macOS アクセサリアプリとして動作し（Dock非表示）、全デスクトップ/Space で使えるフローティングウィンドウを持つ。

要件定義は `spec.md` に記載。現在 Phase 1（MVP）完了済み。Phase 2（フォルダ管理、タグ、全文検索）が次のステップ。

## コマンド

```bash
npm install              # フロントエンド依存パッケージのインストール
npm run tauri dev        # メイン開発コマンド: Vite dev server + Rust バックエンドをホットリロードで起動
npm run tauri build      # プロダクションビルド → src-tauri/target/release/bundle/macos/hyut.app
npm run build            # フロントエンドのみ: tsc && vite build
make lint                # フロントエンド（Biome）+ バックエンド（rustfmt, clippy）の lint & format
make lint-frontend       # Biome のみ
make lint-backend        # rustfmt + clippy のみ
```

TypeScript strict モード（`tsconfig.json`）が主な型チェック手段。

## アーキテクチャ

**フロントエンド（src/）:** React アプリ。Tiptap エディタで WYSIWYG Markdown 編集。状態管理はカスタム hooks で構成：
- `useMemos` — メモの CRUD とリスト状態
- `useAutoSave` — 1秒デバウンスの自動保存。フォーカス喪失・メモ切替時にフラッシュ
- `useAppState` — 最後に開いたメモ ID を localStorage に永続化

**バックエンド（src-tauri/src/）:** Rust バックエンド。ファイル I/O と macOS ネイティブ API を担当：
- `lib.rs` — Tauri セットアップ、グローバルショートカット（Cmd+Shift+M）、objc2 による macOS ウィンドウ設定
- `commands.rs` — 6つの Tauri IPC コマンド: ensure_memo_dir, list_memos, load_memo, save_memo, create_memo, delete_memo
- `memo.rs` — YAML frontmatter のシリアライズ/パース

**IPC ブリッジ:** `src/lib/commands.ts` が全 Tauri invoke 呼び出しをラップ。フロントエンドはファイルシステムに直接触れない。

**データ形式:** 各メモは `~/hyut/{uuid}.md`。YAML frontmatter（id, created_at, updated_at）+ Markdown 本文。タイトルは H1 見出し、または先頭テキストから動的に抽出。

## 主要な規約

- macOS 専用: objc2 でネイティブウィンドウ挙動を制御（アクセサリアクティベーションポリシー、全 Space/フルスクリーン上表示、ポップアップウィンドウレベル）
- Escape またはフォーカス喪失でウィンドウ非表示。Cmd+N で新規メモ作成
- CSS は Apple システムカラー変数を使用し、ライト/ダークモードに自動追従
