// File: src/core/ui/tags/TargetTagEditorResultHandler.ts

export interface TargetTagEditorResultHandler {
  /** 確定 */
  confirm(tag: string): Promise<void>;

  /** キャンセル（任意） */
  cancel?(): void;
}
