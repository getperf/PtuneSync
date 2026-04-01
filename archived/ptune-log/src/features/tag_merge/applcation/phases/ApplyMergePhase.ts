// src/features/tag_merge/application/phases/ApplyMergePhase.ts

import { App } from 'obsidian';
import { TagMergeFlowDialog } from '../../ui/dialogs/TagMergeFlowDialog';
import { ApplyMergeView } from '../../ui/phases/ApplyMergeView';
import { TagMergeContext } from '../TagMergeContext';

import { RenameCandidateExtractor } from '../../services/tag_rename/RenameCandidateExtractor';
import { RenameOperationRowBuilder } from '../../services/tag_rename/RenameOperationRowBuilder';
import { RenameOperationBuilder } from '../../services/tag_rename/RenameOperationBuilder';
import { RenameOperationExecutor } from '../../services/tag_rename/RenameOperationExecutor';
import { TagRenamer } from 'src/features/tag_wrangler/services/TagRenamer';

export class ApplyMergePhase {
  constructor(
    private readonly app: App,
    private readonly dialog: TagMergeFlowDialog,
    private readonly context: TagMergeContext,
    private readonly onDone: () => void,
  ) {}

  open(): void {
    const debugRename = this.context.debugOptions?.showWorkDataDebug === true;

    const extractor = new RenameCandidateExtractor(this.app);
    const candidates = extractor.extract(this.context.priorityGroups, {
      debug: debugRename,
    });

    const rows = new RenameOperationRowBuilder(this.app).build(candidates, {
      debug: debugRename,
    });

    const operation = new RenameOperationBuilder().build(rows);

    const view = new ApplyMergeView(
      async () => {
        const executor = new RenameOperationExecutor(new TagRenamer(this.app));

        await executor.execute(operation, (state) => {
          view.updateProgress(state);
        });

        view.updateDone();
        this.onDone();
      },
      () => this.onDone(),
    );

    this.dialog.setPhaseView(view);
  }
}
