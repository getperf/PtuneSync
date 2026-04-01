// File: src/features/google_tasks/services/time_analysis/llm/prompt/en.ts

import { TimeAnalysisPromptParams } from '.';

export function buildTimeAnalysisPromptEn(
  params: TimeAnalysisPromptParams,
): string {
  const { yamlText, header } = params;

  return `
The following is one day's task execution data represented in YAML format.

# Basic Rules (Required)
- Do not speculate or rely on general assumptions. Write only facts that can be derived from the YAML.
- Do not provide evaluations, interpretations, or improvement ideas. Focus strictly on observed facts.
- Exclude all daily-life tasks marked with 🚫 from all analysis.

# Numeric Rules (Required)
- planned / actual / delta are expressed in pomodoros.
- delta = actual - planned
- Interpretation:
  - delta > 0: over plan (delay)
  - delta < 0: under plan (ahead of schedule)
- Treat |delta| < 1.0 as noise and exclude them from analysis.
- Only list tasks where |delta| >= 1.0.
- Display numeric values with one decimal place.
- Delta notation must be in the form "+1.5" or "-1.5".

# Parent / Child Task Handling (Required)
- Tasks with parentTaskKey are child tasks.
- If both parent and child have actual values:
  - Treat the parent as a gross total.
  - Prioritize child tasks when listing large deltas.
  - If the parent is mentioned, mark it as "total (gross)".

# Unfinished Tasks (status=needsAction)
- If delta < 0:
  - Treat the task as in progress.
  - Do not list or evaluate it.
- If delta > 0:
  - List it as an over-plan task without additional evaluation.

# reviewFlags Handling (Important)
reviewFlags indicate facts recorded by the user that
a task was marked as completed, but issues or pending matters remained.

Meanings of reviewFlags:

- stuckUnknown: Work was stalled and the cause was not identified.
- toolOrEnvIssue: Issues related to tools, environment, or configuration occurred.
- decisionPending: Decisions remained pending during or after completion.
- scopeExpanded: The task scope expanded unexpectedly during execution.
- unresolved: The task was completed, but unresolved items remained.
- newIssueFound: New issues were discovered during execution.

For tasks with reviewFlags, even if status is completed,
do not evaluate or propose solutions.
Only summarize factual states, such as:
- What kind of situation or event occurred
- What remained unresolved or undecided

# Task Title Formatting (Fixed)
- Convert task titles as follows:
  - Child task: "Parent Task: Child Task Name"
  - Parent task: Use the task name as is (truncate only if very long)

YAML:
\`\`\`yaml
${yamlText}
\`\`\`

# Required Output
1) Tasks with Large Delta (|delta| >= 1.0)
   - Bullet format: "Task Name: +1.5" or "Task Name: -1.5"

2) Summary by Work Type (based on tags)
   - Do not output counts
   - Show total actual per tag (one decimal place)

3) Facts Remaining After Completion (Issues / Pending Items)
   - Only tasks with reviewFlags
   - List factual states only (no evaluation or improvement ideas)

4) Daily Summary (2–3 lines)
   - Summarize overall delay / ahead-of-schedule trends as facts
   - Mention the presence of unfinished tasks or reviewFlags in one factual sentence

Output must follow the Markdown structure below, be written in English, and be concise.

${header} Tasks with Large Delta

${header} Summary by Work Type

${header} Facts Remaining After Completion (Issues / Pending Items)

${header} Daily Summary
`.trim();
}
