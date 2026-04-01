## md-ast-core Specification

### 1. Purpose

`md-ast-core` provides **AST-based structural editing** for Markdown documents using the `remark` mdast format.

The library enables **section-oriented manipulation** of Markdown while preserving structural correctness.

All structural modifications **MUST be performed on AST nodes**, not on raw Markdown strings.

---

### 2. Editing Model

Markdown documents are edited through **three layers**:

```
MarkdownFile
   │
   ├─ RootSection (document root)
   │
   └─ Section (heading-based sections)
```

Editing operations are performed through these APIs only.

Direct modification of raw Markdown text or AST nodes outside these APIs is prohibited.

---

### 3. Core Concepts

#### MarkdownFile

Represents a parsed Markdown document.

Primary entry point of the library.

Methods:

* `MarkdownFile.parse(markdown: string)`
* `MarkdownFile.createEmpty()`
* `getFrontmatter()`
* `findSection(matcher: RegExp)`
* `findSectionOrThrow(matcher: RegExp)`
* `root()`
* `toString()`

Example:

```ts
const md = MarkdownFile.parse(markdown);
const today = md.findSection(/Today/);
```

---

#### RootSection

Represents the **document root**.

Allows insertion of **top-level headings**.

Methods:

```
appendChild
prependChild
upsert
ensureChild
getContent
isRoot
```

Example:

```ts
md.root().appendChild({
  title: "Today",
  depth: 2,
  content: () => `
- [ ] Task A
`
});
```

Important characteristics:

* RootSection represents the entire document.
* Insertions always occur at **document level**.
* No positional insertion relative to headings.

---

#### Section

Represents a **heading-based section**.

Each section corresponds to a Markdown heading and its body content.

Methods:

```
appendChild
prependChild
upsert
ensureChild
resetContent
getContent
getHeadingText
getHeadingDepth
```

Example:

```ts
today.appendChild({
  position: "after",
  title: "Extra",
  depth: 3,
  content: () => `
- [ ] Task B
`
});
```

---

#### SectionCursor

Internal structure representing the **AST location** of a section.

Stores:

```
tree
parent
heading node
index
```

Used internally for structural editing operations.

Applications should **not manipulate SectionCursor directly**.

---

### 4. Structural Editing APIs

Structural editing is performed using the following methods.

---

#### appendChild

Creates a new child section.

RootSection:

```ts
appendChild({
  title,
  depth,
  content?
})
```

Section:

```ts
appendChild({
  position: "before" | "after",
  title,
  depth?,
  content?
})
```

Behavior:

* Always creates a new section.
* Does not check for duplicates.

---

#### prependChild

Creates a new section at the **beginning** of a scope.

RootSection:

```
insert at beginning of document
```

Section:

```
insert as first child section
```

---

#### upsert

Ensures that a section exists and inserts content if necessary.

```
upsert({
  matcher,
  title,
  depth,
  content?
})
```

Behavior:

* If matching section exists → content inserted.
* If not → new section created.

---

#### ensureChild

Guarantees that a child section exists.

```
ensureChild({
  title? ,
  matcher? ,
  depth ,
  position? ,
  content?
})
```

Behavior:

1. Search for section matching `matcher`
2. If found → return section
3. If not → create section
4. Return created section

Use cases:

* Idempotent document generation
* Template construction
* Section scaffolding

---

#### 4.1 Heading Matchers

Section matching uses **regular expressions** to identify headings.

To simplify matcher construction, the library provides helper utilities in `matchers`.

These helpers generate safe regular expressions for heading titles.

##### hdr()

Creates a matcher for **exact heading title match**.

```ts
hdr("Today")
```

Generated pattern:

```text
/^Today$/
```

Example:

```ts
const today = md.findSection(hdr("Today"));
```

---

##### hdrWith()

Matches a heading title with an **additional suffix pattern**.

Example:

```ts
hdrWith("KPT分析", "\\(.+\\)")
```

Matches:

```
KPT分析(2024-01-01)
KPT分析(v2)
```

Generated pattern:

```text
/^KPT分析\(.+\)$/
```

---

##### hdrAllowPrefix()

Allows **prefix decorations** before a heading title.

Useful when headings contain icons or markers.

Example headings:

```
📅 今日の予定タスク
⭐ 今日の予定タスク
```

Matcher:

```ts
hdrAllowPrefix("今日の予定タスク")
```

Generated pattern:

```text
/^.*今日の予定タスク$/
```

---

##### hdrAllowPrefixWith()

Allows both:

* prefix decoration
* suffix pattern

Example:

```ts
hdrAllowPrefixWith("Today", "\\(.+\\)")
```

Matches:

```
📅 Today (2024)
⭐ Today (Draft)
```

Generated pattern:

```text
/^.*Today\(.+\)$/
```

---

##### Usage Recommendation

When matching headings, prefer using the matcher helpers.

Recommended:

```ts
md.findSection(hdr("Today"))
```

Avoid writing manual regular expressions:

```ts
// discouraged
md.findSection(/^Today$/)
```

Reasons:

* safer escaping
* consistent matching rules
* easier refactoring

---

##### Escaping Behavior

`hdr()` internally escapes regex metacharacters.

Example:

```ts
hdr("C++")
```

Generated pattern:

```
/^C\+\+$/
```

This ensures heading titles containing special characters are matched correctly.

---

##### Matching Scope

Heading matchers only evaluate the **text content of heading nodes**.

Example heading:

```
## Today
```

The matcher receives:

```
"Today"
```

Markdown syntax (`##`, `###`, etc.) is not included in the matching process.

---

### 5. Retrieval APIs

Sections can be located using regex matchers.

```
findSection(regex)
findSectionOrThrow(regex)
```

Example:

```ts
const today = md.findSection(/Today/);
```

These methods search heading text.

---

### 6. Section Content Editing

To replace section body content:

```
section.resetContent(markdownBody)
```

Rules:

* Input MUST NOT contain headings.
* Fragment parsing is performed internally.

Example:

```ts
today.resetContent(`
- [ ] Task A
- [ ] Task B
`);
```

---

### 7. AST Responsibility Boundary

AST parsing MUST only occur inside the parser layer.

Allowed parser:

```
MarkdownParser
```

Forbidden locations:

```
Section
RootSection
operation utilities
```

Fragment parsing MUST use:

```
parseMarkdownFragment()
```

Direct usage of `unified()` is prohibited.

---

### 8. Root Editing Rule

When modifying document root:

```
md.root().appendChild(...)
```

Do NOT:

* manually push AST nodes
* construct headings manually
* modify raw Markdown strings

---

### 9. New Document Creation

To create a new Markdown document:

```ts
MarkdownFile.createEmpty()
```

Example:

```ts
const md = MarkdownFile.createEmpty();

md.root().appendChild({
  title: "Today",
  depth: 2,
  content: () => "- [ ] Task"
});

const output = md.toString();
```

---

### 10. Stringify Behavior

Output Markdown is normalized by remark.

Expected normalization:

* `-` and `*` list markers may change
* `_` may be escaped
* bold syntax may change
* whitespace may change

Exact textual reproduction is **not guaranteed**.

---

### 11. Anti-Patterns

The following operations are prohibited.

#### String concatenation

```ts
markdown += "\n### Extra\n- [ ] Task";
```

#### String replacement

```ts
markdown.replace("### Today", "### Today\n### Extra");
```

These violate the AST editing rule.

---

### 12. Canonical Usage Pattern

```ts
import { MarkdownFile } from "md-ast-core";

const md = MarkdownFile.parse(input);

const today = md.findSection(/Today/);
if (!today) throw new Error("Section not found");

today.appendChild({
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
