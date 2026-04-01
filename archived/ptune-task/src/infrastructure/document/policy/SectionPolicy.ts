// src/infrastructure/document/policy/SectionPolicy.ts

export class SectionPolicy {
  static readonly IMPORT_SUBSECTION_TITLE = "__imported_tasks__";

  static getImportSubsectionTitle(): string {
    return this.IMPORT_SUBSECTION_TITLE;
  }
}
