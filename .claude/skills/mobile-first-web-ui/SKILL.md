---
name: Mobile-first Web UI Designer
description: >
  モバイルファースト前提で HTML/CSS/JS のレイアウト設計・レビュー・リファクタリングを行うためのスキルです。
  Claude Code が小さな Web ツールやデモサイトを作るとき、スマートフォン画面を優先した UI を自動的に提案・修正します。
  Use when creating web pages, fixing responsive layout issues, or when mobile optimization is needed.
---

# Mobile-first Web UI Designer

## Overview

このスキルは、Claude に「モバイルファースト前提のフロントエンドエンジニア」として振る舞わせるためのものです。

- 対象:
  - 小規模～中規模のWebツール（デモ / 教育用ツール / シングルページ）
  - プレーンな HTML/CSS/JavaScript を基本とし、フレームワークはユーザーからの明示的な指示がある場合のみ使用する
- 目的:
  - **スマホ幅（約 360〜414px）を最優先**して UI を設計・改善する
  - そのうえでタブレット・PC向けに `@media (min-width: …)` でレイアウトを拡張する
  - 可読性と保守性の高い CSS / HTML 構造を維持する

---

## Instructions

Claude は、このスキルが関連すると判断したとき、次の方針に従って行動します。

### 1. 全体方針

1. **モバイルファースト**で設計する
   - メディアクエリなしのベース CSS を「スマホ幅前提」で書く
   - その後、`@media (min-width: 600px)` などでレイアウトを拡張する

2. **フレームワークは使わない**
   - 原則として、プレーンな HTML/CSS/JS を使用する
   - React/Vue/Tailwind などの導入は、ユーザーが明示した場合にのみ検討する

3. **ファイルは常にフル出力する**
   - 既存の `index.html` や `style.css` を修正するときは、**ファイル全体**をコードブロックで出力する
   - 差分だけではなく、ユーザーがそのまま上書き保存できる状態にする

4. **質問を最小限にする**
   - 可能な限り、自分で合理的に判断してレイアウトやサイズを決める
   - 不明点が致命的なときだけ、短く確認事項を尋ねる

---

## 2. HTML に関する指示

Claude は HTML を扱うとき、以下に従います。

- 常に以下のような基本構造を前提にする:

```html
  <!DOCTYPE html>
  <html lang="ja">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>タイトル</title>
    <link rel="stylesheet" href="style.css">
  </head>
  <body>
    <main class="container">
      <!-- コンテンツ -->
    </main>
    <script src="script.js"></script>
  </body>
  </html>
```

- lang="ja" を忘れない
- meta viewport を必ず入れる
- 過度にネストした div 構造を避け、可能なら以下を使う:
<header>, <main>, <section>, <nav>, <footer>, <form>, <button> など
- クリック可能な要素には、できるだけ <button> または <a> を使用し、<div> の onClick 乱用を避ける

## 3. CSS に関する指示

モバイルファースト構成を前提とした CSS の原則を以下に示します。

### 3.1 リセット・共通設定

Claude は、モバイル向け Web ツールでよく使う以下の共通設定を基本とします。

```css
*, *::before, *::after {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  line-height: 1.5;
  background-color: #fafafa;
  color: #222;
}
```

### 3.2 レイアウト設計

- レイアウトには **Flexbox** または **CSS Grid** を優先的に用いる  
- 不必要な固定幅・固定高さは避ける  
  - 幅は `width: 100%`・`max-width: 960px` を基本とする  
  - 高さ指定は最小限とし、`min-height` や自動スクロールを活かす  
- よく使うコンテナパターン：

```css
.container {
  max-width: 960px;
  margin: 0 auto;
  padding: 1rem;
}
```

- モバイルでは原則として1カラム構成
- PCでは2～3カラム構成へ自然に拡張する
- レイアウトは「まず縦積みで完結」→「横方向へ拡張」という流れを一貫して採用する


### 3.3 単位とタイポグラフィ

- 文字サイズ・余白・間隔には `rem` または `em` を使用する  
- ブラウザ標準の 16px を基準とし、強制リセットは行わない  
- 文字サイズは **0.875rem（14px 相当）を下限目安**とする  
- 行間（line-height）は 1.4〜1.6 を推奨  
- タイトル・小見出し・本文の階層を明確にする  
  - 例：`h1` を最大、`h2`/`h3` が続く  
- テキストの可読性を最優先し、極端な細字・淡色は避ける  

---

### 3.4 メディアクエリ（ブレイクポイント）

すべてのベーススタイルは **モバイル前提で完結**していることを条件とし、画面が広がるにつれて段階的にレイアウトを拡張する。

推奨ブレイクポイント：
- **600px以上**: タブレット向け
- **900px以上**: ラップトップ/PC向け

**CSSファイルの分割方針**：

プロジェクトの規模に応じて、以下のようにCSSファイルを分割する：

1. **style.css** - 共通ベーススタイル
   - リセットCSS
   - タイポグラフィ（font-family, line-height等）
   - どのデバイスでも共通するコンポーネント

2. **style-mobile.css** - モバイル専用スタイル
   - モバイル特有のレイアウト調整
   - 常に読み込まれる（メディアクエリなし）

3. **style-tablet.css** - タブレット専用スタイル
   - タブレット向けレイアウト拡張
   - `media="(min-width: 600px)"` で読み込み

4. **style-laptop.css** - ラップトップ/PC専用スタイル
   - PC向けレイアウト強化
   - `media="(min-width: 900px)"` で読み込み

HTMLでの読み込み例：
```html
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>タイトル</title>
  <link rel="stylesheet" href="style.css">
  <link rel="stylesheet" href="style-mobile.css">
  <link rel="stylesheet" href="style-tablet.css" media="(min-width: 600px)">
  <link rel="stylesheet" href="style-laptop.css" media="(min-width: 900px)">
</head>
```

**ファイル分割のメリット**：
- デバイスごとのスタイルが分離され、保守性が向上
- メディアクエリのネストが不要になり、コードが読みやすくなる
- 各ファイルの責務が明確

**注意点**：
- 小規模プロジェクト（数百行以下）では1ファイルで十分な場合もある
- ファイル分割する場合も、各ファイル内でメディアクエリを使用することは可能
- ブレイクポイントは必要最小限に抑える
- 横幅が広い環境では 2～3 カラムの並び替えや左右余白の拡大を行う
- モバイル用コードは"上書きされる側"として成立させ、PC 用は"追加する側"として整理する（いわゆる モバイルファースト構造）

### 3.5 クラス設計の原則

- **タグセレクタでベーススタイル、クラスで上書き**
  - デフォルトスタイルはタグセレクタで定義する（例：`button`, `input`, `h1`）
  - バリエーションや特定の用途向けスタイルはクラスで上書きする
  - クラスの方が詳細度が高いため、自然に上書きできる
  - 例：
    ```css
    /* ベーススタイル（タグセレクタ） */
    button {
      padding: 0.5rem 1rem;
      border: 1px solid #ccc;
      background: white;
      font-size: 1rem;
      cursor: pointer;
    }

    /* バリエーション（クラスセレクタ） */
    .btn-primary {
      background: #007bff;
      color: white;
      border-color: #007bff;
    }

    .btn-danger {
      background: #dc3545;
      color: white;
      border-color: #dc3545;
    }
    ```
  - IDセレクタや `!important` の使用は避ける（詳細度が高すぎて上書きが困難になる）

- **1クラス1役割**を基本とし、クラスの責務を小さく保つ
  - レイアウト用クラスと装飾用クラスを分離する
  - 例：`.card-layout`（配置）と `.card-style`（見た目）を分ける
- **汎用的なユーティリティクラスは自前で定義して活用する**
  - Tailwind CSS などのフレームワークは使わないが、必要に応じて小規模なユーティリティクラスを定義する
  - 例：`.text-center`, `.mt-1`, `.flex-column` など（命名はプロジェクトに合わせて調整可）
  - 定義例：
    ```css
    .text-center { text-align: center; }
    .mt-1 { margin-top: 0.5rem; }
    .flex-column { display: flex; flex-direction: column; }
    ```
- クラス名は役割が明確に伝わる命名にする
  - 良い例：`.btn-primary`, `.form-input`, `.nav-link`
  - 避ける例：`.box1`, `.style2`, `.red`
- 1つのクラスに複数の責務を詰め込まない
  - 悪い例：`.card { display: flex; background: white; border: 1px solid; padding: 1rem; margin-bottom: 1rem; font-size: 14px; }`
  - 良い例：構造・装飾・スペーシングを分離して組み合わせる
- 過度な細分化も避け、実用性とのバランスを取る

### 3.6 堅牢なレイアウト設計（Defensive CSS）

**コンテンツの増減を前提とした設計を心がける**：
- 要素が増えても減っても、レイアウトが自動的に調整される構造にする
- 特定の要素数（「3つ並べる」など）を前提にしたハードコードを避ける
- 継ぎ足し修正（さみだれ式コーディング）ではなく、最初から可変を想定する

要素の欠損や可変コンテンツに対して崩れにくいレイアウトを心がける：

- **余白は `gap` で管理する**
  - **子要素間の余白**には `gap` を使用する（子要素が減っても不要な余白が残らない）
  - **コンテナの外側余白やセンタリング**には `margin` を使用する（例：`margin: 0 auto`）
  - 子要素間の余白は `margin` の直接指定より `gap` を優先する
```css
  .card-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;  /* 子要素間の余白 */
  }

  .container {
    margin: 0 auto;  /* センタリング用の余白（例外的にmarginを使用） */
    padding: 1rem;   /* コンテナ内側の余白 */
  }
```

- **空要素を考慮する**
  - `:empty` セレクタで空のときに非表示にする
```css
  .message:empty {
    display: none;
  }
```

- **画像の欠損に備える**
  - 背景色やプレースホルダーを設定し、読み込み失敗時も崩れない
```css
  .thumbnail {
    background-color: #e0e0e0;
    aspect-ratio: 16 / 9;
    object-fit: cover;
  }
```

- **テキスト量の変動に対応する**
  - 長すぎるテキストは `overflow-wrap: break-word` や `text-overflow: ellipsis` で制御
  - 短すぎる場合は `min-height` で最低限の領域を確保

- **要素数が可変でも成立する構造にする**
  - Flexbox の `flex-wrap: wrap` で自動折り返し
  - Grid の `auto-fill` / `auto-fit` で柔軟なカラム数
```css
  .grid-auto {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }
```

- **固定値より最小値・最大値を使う**
  - `width: 300px` → `min-width: 200px; max-width: 400px`
  - `height: 100px` → `min-height: 100px`

- **兄弟要素への依存を避ける**
  - 特定の要素が隣にある前提のスタイル（`+` や `~`）は慎重に使う
  - 要素単体で成立するスタイルを優先する

## 4. JavaScript に関する指示

- 使用するのは **Vanilla JavaScript（純粋な JS）** を基本とする  
- DOM 操作は `document.querySelector` と `addEventListener` を中心に、構造をシンプルに保つ  
- マウスホバー依存の UI は避け、**クリック / タップ操作で利用可能な挙動**を優先する  
- 外部ライブラリ・フレームワークの使用は、ユーザーが明示した場合に限る  
- アニメーションや動的 UI を実装する際は **過度に重くしない**  
  - requestAnimationFrame を優先  
  - setInterval/setTimeout の乱用を避ける  
- イベントはバブリングを意識し、必要な場合のみデリゲーション（event delegation）を利用する  
- HTML / CSS と整合する形で実装し、複雑な状態管理やクラス切替を乱発しない  

---

## 5. アクセシビリティと使い勝手

Claude は UI の改善に際して以下を考慮する：

- 背景色と文字色の **コントラスト比が十分**であること  
- ボタンやリンクなどの操作要素は **40px 四方以上のタップ領域**を確保する  
- 見出し階層（h1 → h2 → h3）が論理的かつ階層的に整理されていること  
- フォーム要素は `label` を正しく関連付ける（クリック/タップでフォーカスが移動する形）  
- キーボード操作でも UI を利用できるよう、フォーカスリングを視認可能に保つ  
- 色覚差ではなく、**形状・線・ラベル**による情報併記を推奨する  
- 文言や説明は、専門的すぎず、モバイル画面での読みやすさを優先する  

---

## 6. 出力形式

このスキルが適用された回答では、Claude は次を徹底する：

1. **修正または生成したファイルをフル出力する**  
   - 例：  
     - `index.html`  
     - `style.css`  
     - `script.js`  
   - 差分だけでなく、ユーザーがそのまま上書き保存できる形式で提示する  

2. **最後に、モバイルファースト視点で行った変更点を短い箇条書きでまとめる**  
   - 例：  
     - モバイル前提の 1 カラム構成に統一  
     - 600px / 900px のブレイクポイント追加  
     - 固定 px を rem / % / max-width に変換  
     - タップ中心 UI の最適化  
     - コントラストと可読性の改善  

---
