// src/core/templates/project_index_bases.ts
export const PROJECT_INDEX_BASES_BLOCK = `
\`\`\`base
views:
  - type: list
    name: NoteSummaries
    filters:
      and:
        - file.inFolder("{{folderPath}}")
        - file.hasProperty("dailynote")
    groupBy:
      property: dailynote
      direction: DESC
    order:
      - file.name
      - summary
      - tags
    sort:
      - property: file.name
        direction: DESC
\`\`\`
`;
