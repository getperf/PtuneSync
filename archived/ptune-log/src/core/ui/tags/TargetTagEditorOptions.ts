// File: src/core/ui/tags/TargetTagEditorOptions.ts

import { TargetTagEditorState } from './TargetTagEditorState';
import { TargetTagSearchPort } from './TargetTagSearchPort';
import { TargetTagEditorResultHandler } from './TargetTagEditorResultHandler';

export interface TargetTagEditorOptions {
  state: TargetTagEditorState;
  search: TargetTagSearchPort;
  result: TargetTagEditorResultHandler;
}
