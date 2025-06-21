export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // 新機能
        'fix', // バグ修正
        'docs', // ドキュメント
        'style', // コードスタイル
        'refactor', // リファクタリング
        'perf', // パフォーマンス改善
        'test', // テスト
        'build', // ビルドシステム
        'ci', // CI設定
        'chore', // その他
        'revert', // リバート
      ],
    ],
    'subject-case': [2, 'never', ['pascal-case', 'upper-case']],
    'subject-max-length': [2, 'always', 72],
    'body-max-line-length': [2, 'always', 100],
  },
};
