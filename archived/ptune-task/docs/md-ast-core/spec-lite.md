# md-ast-core Usage Contract (Evaluation Version)

## 1. Purpose

md-ast-core edits Markdown using AST (remark mdast).
All structural modifications MUST be AST-based.

---

## 2. Mandatory Rules

You MUST:

- Use `MarkdownFile.parse`.
- Use `findSection` or `findSectionOrThrow`.
- Use `append`, `upsert`, or `resetContent` for structural or content changes.
- Call `toString()` to serialize.

You MUST NOT:

- Concatenate entire Markdown documents.
- Insert headings manually.
- Modify raw Markdown text outside Section APIs.
- Modify YAML directly without FrontmatterAccessor.

All edits must be AST-based.

---

## Root Editing Rule

When modifying the root:

* Use `md.root().append(...)`
* Do NOT use `Section.append` on root
* Do NOT manually push AST nodes

---

## New Document Rule

To create a new Markdown document:

```ts
MarkdownFile.createEmpty()
```

Do NOT manually construct raw Markdown strings.

---

## Section Content Editing Rule

To replace section body content:

* Use `section.resetContent(markdownBody)`
* The input MUST NOT contain heading nodes.
* Fragment parsing is allowed.
* Structural integrity must be preserved.

Direct string replacement on the entire document is prohibited.

---

## 3. Stringify Behavior

Output is normalized by remark.

- Bullet markers may be `-` or `*`.
- `_` may become `\_`.
- `__bold__` may become `**bold**`.

Do NOT attempt to override normalization.

---

## 4. Canonical Example

Correct way to append a new task section:

```ts
import { MarkdownFile } from "md-ast-core";

const md = MarkdownFile.parse(input);

const today = md.findSection(/Today/);
if (!today) throw new Error("Section not found");

today.append({
  position: "after",
  title: "Extra",
  depth: 3,
  content: () => `
- [ ] Task A
- [ ] Task B
`,
});

const output = md.toString();
```

This pattern MUST be followed.

---

## 5. Anti-Pattern Examples

These are invalid:

```ts
// ❌ String concatenation
const output = input + "\n### Extra\n- [ ] Task";
```

```ts
// ❌ String replace
markdown.replace("### Today", "### Today\n### Extra");
```

These violate AST usage requirements.

---

## 6. Output Requirements

* Output TypeScript only.
* Do not explain.
* Do not modify raw Markdown strings.
