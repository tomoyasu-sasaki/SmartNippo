# モノレポ依存関係エラー調査レポート

**日付:** 2024年6月25日 **目的:**
プロジェクト全体のビルドおよび型チェックで発生したエラーの原因を特定し、恒久的な対策を施す。同様の問題の再発を防止するための知見を記録する。

---

## 概要

本レポートは、`pnpm build`および`pnpm type-check`実行時に、複数のパッケージ（特に
`packages/lib`, `packages/ui`,
`apps/mobile`）で発生したビルド・型定義解決エラーに関する調査結果と対応内容をまとめたものである。

エラーの根本原因は、単一の問題ではなく、以下の要因が複雑に絡み合っていた。

1.  **ワークスペース間の依存関係解決の不備:**
    `pnpm`ワークスペース環境下で、TypeScriptコンパイラ(`tsc`)やビルドツール(`tsup`)が他パッケージの型定義やソースコードを正しく見つけられていなかった。
2.  **ビルドツールの設定ミス:**
    UIライブラリ(`@smartnippo/ui`)のビルドツール`tsup`が、外部で提供されるべき依存関係（`peerDependencies`）をバンドルに含めようとして失敗していた。
3.  **パスエイリアスの不適切な使用:**
    ライブラリパッケージ内で、アプリケーションレベルで使われるようなパスエイリアス(`@/`)が使用されており、自己完結性が損なわれていた。
4.  **フレームワークへの不適切な依存:**
    共通UIライブラリが、特定のフレームワーク（Next.js）のコンポーネントに依存していた。
5.  **Expo (React Native) の特殊なモジュール解決:**
    `tsc`が参照する`tsconfig.json`と、Metro
    Bundlerが参照する`metro.config.js`の両方で、モジュール解決の設定を整合させる必要があった。

これらの問題を段階的に特定し、各パッケージの設定を修正することで、最終的にプロジェクト全体のビルドと型チェックが安定して成功する状態を回復した。

---

## パッケージ別 問題と解決策

### 1. `packages/lib`

- **現象:**
  - `tsup`でのビルド時、d.ts（型定義ファイル）の生成に失敗する (`error occurred in dts build`)。
  - `error TS6307: File '...' is not listed within the file list of project ''.`
    というエラーが表示され、`tsconfig.json`が読み込まれていない挙動を示した。

- **根本原因:**
  - モノレポのルートから`pnpm --filter @smartnippo/lib build`を実行した際に、`tsup`が内部で`tsc`を呼び出すコンテキストで`tsconfig.json`の`include`や`files`を正しく解釈できていなかった。
  - `tsc`コマンドを`tsup`の前後に実行するビルドスクリプトも、実行コンテキストの問題でサイレントに失敗し、型定義ファイルが生成されていなかった。

- **最終的な解決策:**
  - **ビルドプロセスの放棄:**
    このパッケージのビルドに依存するのをやめ、他のパッケージ(`apps/web`,
    `apps/mobile`)が`@smartnippo/lib`のソースコードを直接参照する方式に切り替えた。
  - これにより、`packages/lib`を事前にビルドする必要がなくなり、開発時の複雑さとエラーの原因が根本的に取り除かれた。

### 2. `packages/ui`

- **現象:**
  - ビルド時に`Could not resolve "date-fns"`,
    `Could not resolve "react-day-picker"`などのエラーが発生。
  - ビルド時に`Could not resolve "@/components/ui/label"`というパスエイリアス解決エラーが発生。
  - ビルド時に`Could not resolve "next/link"`というNext.jsへの依存エラーが発生。
  - 型チェック時に多数の`Cannot find module`エラーが発生。

- **根本原因:**
  1.  **依存関係の不備:** `date-fns`, `react-day-picker`,
      `react-hook-form`などが`dependencies`や`devDependencies`に含まれておらず、`peerDependencies`としても宣言されていなかった。
  2.  **ビルド設定の不備:**
      `tsup.config.ts`が存在しないか、または`external`オプションが設定されておらず、上記のピア依存関係をバンドルしようとしていた。
  3.  **パスエイリアスの誤用:**
      パッケージ内で完結すべきコンポーネント間のインポートに、プロジェクトルートを基準とするような`@/`エイリアスが使用されていた。
  4.  **フレームワーク依存:** `header.tsx`で`next/link`が直接使用されていた。

- **最終的な解決策:**
  1.  **`package.json`の整理:** `react`, `date-fns`, `react-day-picker`,
      `react-hook-form`などを`peerDependencies`として正しく定義した。UIコンポーネントが直接利用する`sonner`などは`dependencies`に残した。
  2.  **`tsup.config.ts`の整備:**
      `external`オプションに、すべての`peerDependencies`を明記し、バンドルから除外するように設定した。
  3.  **パスの相対化:**
      `grep`と`sed`を使い、パッケージ内の`@/`エイリアスをすべて相対パス (`../`
      or `./`) に置換し、パッケージの自己完結性を高めた。
  4.  **`next/link`の削除:**
      `header.tsx`内の`Link`コンポーネントを標準の`<a>`タグに置き換えた。

### 3. `apps/web` & `apps/mobile`

- **現象:**
  - `@smartnippo/lib`の型定義が見つからない (`TS7016`) エラー。
  - `next lint`実行時の`Invalid Options`エラー。
  - `apps/mobile`での`zodResolver`と`useForm`の型不一致エラー。

- **根本原因:**
  1.  **型解決:**
      `packages/lib`が正しくビルドされていなかったため、型情報が提供されていなかった。
  2.  **ESLint:** `next lint`コマンドとESLint v9（Flat Config）の非互換性。
  3.  **React Nativeの型解決:**
      `tsc`は`tsconfig.json`の`paths`を、Metroは`metro.config.js`の`alias`を参照するため、両方の設定が必要だった。

- **最終的な解決策:**
  1.  **`tsconfig.json`の`paths`設定:**
      `apps/web`と`apps/mobile`の両方で、`@smartnippo/lib`が`packages/lib/src`を直接参照するように`paths`を設定した。これにより、`packages/lib`のビルド問題を回避した。
  2.  **`metro.config.js`の`alias`設定:**
      `apps/mobile`では、`tsconfig.json`の`paths`と整合性が取れるように、`metro.config.js`にも同様のエイリアスを設定した。
  3.  **ESLintスクリプトの修正:**
      `apps/web/package.json`の`lint`スクリプトを`next lint`から`eslint .`に変更した。
  4.  **フォームの型定義のローカライズ:**
      `apps/mobile`で最後まで残った`useForm`の型エラーは、`@smartnippo/lib`からスキーマをインポートするのをやめ、コンポーネントファイル内で直接Zodスキーマを定義することで解決した。これは、複雑なモノレポの型解決における最終手段として有効だった。

### 4. `packages/types`

- **現象:**
  - 型チェック時に`Cannot find module '@/convex/_generated/dataModel'`エラーが発生。

- **根本原因:**
  - `@/`エイリアスでプロジェクトルートにある`convex`ディレクトリを参照していたが、`tsconfig.json`の`baseUrl`や`paths`の設定が不適切で、`tsc`が解決できていなかった。

- **最終的な解決策:**
  - `src/index.ts`内のインポート文を、エイリアスではなく、`'../../convex/_generated/dataModel'`という明確な相対パスに修正した。

---

## 再発防止策

1.  **ライブラリの自己完結性の徹底:**
    - `packages`配下のライブラリ（特に`ui`）では、`@/`のようなプロジェクトレベルのパスエイリアスは使用せず、**コンポーネント間の参照は必ず相対パスで行う**。
    - 共通ライブラリは、特定のフレームワーク（Next.jsなど）に依存するコードを含めない。フレームワーク固有の機能は、ライブラリのコンポーネントをラップする形でアプリケーション側(`apps/*`)で実装する。

2.  **依存関係の厳格な管理:**
    - UIコンポーネントライブラリ(`@smartnippo/ui`)が利用する外部ライブラリは、`peerDependencies`として明記することを徹底する。
    - `tsup`などのビルドツールでは、`external`オプションに全ての`peerDependencies`を必ず含める。

3.  **単一責任の原則 (ビルドと型定義):**
    - `tsup`にJSのバンドルとd.tsの生成を両方任せるのが最もシンプルで推奨される。今回の`packages/lib`のように`tsup`のd.ts生成がうまく機能しない稀なケースでは、ビルドスクリプトを`"build": "tsup && tsc --emitDeclarationOnly"`のように分離し、役割を明確にすることも有効な手段となる。

4.  **アプリケーションのモノレポ依存解決:**
    - Next.js (`apps/web`) や Expo
      (`apps/mobile`) からワークスペース内の他パッケージを参照する場合、`tsconfig.json`の`paths`でソースコード(`src`)を直接参照する方法を第一の選択肢とする。これにより、開発時にライブラリを都度ビルドする手間が省ける。
    - Expoプロジェクトでは、`metro.config.js`の`alias`と`tsconfig.json`の`paths`の両方に、整合性の取れた設定を記述する必要があることを認識する。

5.  **型エラーのデバッグ:**
    - 複雑な型エラー（特に`zodResolver`関連）が発生した場合、モジュール解決が失敗してインポートした型が`any`になっている可能性をまず疑う。
    - 問題が切り分けられない場合は、今回`apps/mobile`で行ったように、一時的に型定義をコンポーネントファイル内にローカライズすることで、問題がモジュール解決にあるのか、型定義そのものにあるのかを特定する。
