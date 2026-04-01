// src/features/daily_review/i18n/ja.ts

export const jaTexts = {
  // --- コメント（複数行） ---
  'daily-review-comment': [
    '以下は、当日の作業内容をもとに LLM が生成した要約です。',
    '内容に誤りや補足がある行はチェックし、レビューコメントを追加してください。',
    'このレビュー内容は後続の 振り返りに利用されます。',
  ],

  'review-point-action-comment': [
    '[XMind による振り返り手順]',
    '1. 「インプット」配下のテキストをすべてコピーしてください',
    '2. XMind に貼り付けて編集（構造・粒度・表現を調整）',
    '3. 編集後の内容を「アウトプット」配下に貼り付けてください',
    '4. 「アウトプット」を振り返りのまとめとして記録します',
  ],

  'xmind-input-heading': 'インプット（XMind 用）',
  'xmind-output-heading': 'アウトプット（XMind 編集結果）',

  'daily-review-unregistered-guide': [
    '※ 未登録タグがあります。',
    '→ コマンド「エイリアス辞書にタグを登録・マージ」で名寄せを行ってください。',
  ],
} as const;
