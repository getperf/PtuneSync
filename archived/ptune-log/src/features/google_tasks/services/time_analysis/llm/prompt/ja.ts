// File: src/features/google_tasks/services/time_analysis/llm/prompt/ja.ts

import { TimeAnalysisPromptParams } from '.';

export function buildTimeAnalysisPromptJa(
  params: TimeAnalysisPromptParams,
): string {
  const { yamlText, header } = params;

  return `
以下は 1 日分のタスク実績を YAML 形式で表したデータです。

# 基本ルール（必須）
- 推測や一般論は禁止。YAML に記載された事実のみを扱うこと。
- 評価・改善案・対策・原因分析は書かないこと。
- 🚫 を含む生活系タスクは、すべての分析対象から除外すること。

# 数値の扱い（必須）
- planned / actual / delta は pomodoro に含まれる。
- delta = actual - planned
- 解釈:
  - delta > 0 : 計画超過
  - delta < 0 : 計画未満
- |delta| < 1.0 は誤差として扱い、分析対象から除外する。
- 列挙対象は |delta| >= 1.0 のタスクのみ。
- 数値は小数点1位、差分表記は「+1.5」「-1.5」に統一する。

# 親子タスクの扱い（必須）
- parentTaskKey があるものは子タスク。
- 親子とも actual がある場合:
  - 親は合計（グロス）として扱う。
  - 差分の列挙は子タスクを優先する。
  - 親を列挙する場合は「合計」と補足する。

# 未完了タスク（status=needsAction）
- delta < 0 :
  - 作業途中とみなし、差分の列挙や整理は行わない。
- delta > 0 :
  - 計画超過として事実のみ列挙してよい。

# reviewFlags の扱い（重要・厳守）

reviewFlags は「完了したが問題・宿題が残った」という**事実ラベル**である。
文章化・説明文生成は禁止する。

各 reviewFlag は、以下の **略称ラベル（名詞句）** に変換すること：

- operationMiss     → 操作ミス
- toolOrEnvIssue    → 環境問題発生
- decisionPending   → 未解決
- scopeExpanded     → 難問
- unresolved        → 残件あり
- newIssueFound     → 新規課題

## 整理ルール
- 出力は「1 略称ラベル = 1 行」とする。
- 各行では、該当するタスク主題を読点（、）で列挙する。
- 同一タスクが複数ラベルに該当する場合でも、
  行は増やさず、それぞれのラベル行に含める。
  
# タスク名ルール
- タスク名は意味単位で扱い、分割しない。
- 「親(子)」形式は、親タスクを主体とした補足表記である。
- 簡略化は括弧内のみ許可する。
- 親タスク名は省略しない。

YAML:
\`\`\`yaml
${yamlText}
\`\`\`

# 出力してほしい内容

1) 差分が大きいタスク（|delta| >= 1.0）
   - 箇条書き
   - 形式: 「タスク名: +1.5」「タスク名: -1.5」

2) 作業タイプ別サマリー（tags ベース）
   - 件数は出さない
   - 各タグごとに actual 合計（小数点1位）
   - 名詞句のみ

3) 完了タスクに残った問題・宿題
   - 以下の形式に限定する

   - 略称ラベル：タスク主題A、タスク主題B、タスク主題C

4) 日次要約（2〜3行）
   - 文章可
   - 差分傾向の事実整理のみ
   - reviewFlags 付きタスクの存在に 1 文で触れる

出力は以下の Markdown 構成、日本語、簡潔に。

${header} 差分が大きいタスク

${header} 作業タイプ別サマリー

${header} 完了タスクに残った問題・宿題

${header} 日次要約
`.trim();
}
