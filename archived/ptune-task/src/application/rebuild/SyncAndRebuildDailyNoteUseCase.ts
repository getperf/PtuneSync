import { DailyNote } from "../../domain/daily/DailyNote";
import { TaskEntry } from "../../domain/task/TaskEntry";
import { DailyNoteDocumentAdapter } from "../../infrastructure/document/adapter/DailyNoteDocumentAdapter";
import { DailyNoteRepository } from "../../infrastructure/repository/DailyNoteRepository";
import { logger } from "../../shared/logger/loggerInstance";
import { PtuneRuntime } from "../../shared/PtuneRuntime";

import { TodayResolver } from "../calendar/services/TodayResolver";
import { buildTaskTree } from "../planning/services/buildTaskTree";
import { generateTaskEntries } from "../planning/services/generateTaskEntries";
import { renderTaskTree } from "../planning/services/renderTaskTree";
import { MarkdownToJsonUseCase } from "../planning/usecases/MarkdownToJsonUseCase";

import { PlannedTaskSectionBuilder } from "../planning/builders/PlannedTaskSectionBuilder";
import { MergeTaskTreeService } from "../sync/merge/MergeTaskTreeService";
import { getDefaultTaskListId } from "../sync/shared/DefaultTaskListId";

import { PullQuery } from "../sync/shared/dto/PullQuery";
import { PtuneSyncPort } from "../sync/shared/ports/PtuneSyncPort";
import { SyncPhase } from "../../domain/task/SyncPhase";
import type { RawPayload } from "../../infrastructure/conversion/task/json/JsonToEntries";

export class SyncAndRebuildDailyNoteUseCase {
  constructor(
    private readonly syncPort: PtuneSyncPort,
    private readonly todayResolver: TodayResolver,
    private readonly repository: DailyNoteRepository,
    private readonly runtime: PtuneRuntime,
    private readonly mergeService: MergeTaskTreeService = new MergeTaskTreeService(),
  ) {}

  async execute(): Promise<DailyNote> {
    logger.debug("[UseCase:start] SyncAndRebuildDailyNoteUseCase");

    const today = this.todayResolver.resolve();
    logger.debug(`[UseCase] SyncAndRebuildDailyNoteUseCase date=${today}`);

    const note = await this.repository.findByDate(today);

    if (!note) {
      throw new Error("Daily note not found.");
    }

    const adapter = new DailyNoteDocumentAdapter(note.content);

    const phase = adapter.getSyncPhase() ?? SyncPhase.Planning;

    logger.debug(`[UseCase] SyncAndRebuildDailyNoteUseCase phase=${phase}`);

    const query: PullQuery = {
      list: getDefaultTaskListId(),
      includeCompleted: phase === SyncPhase.Working,
    };

    // --- remote pull ---
    const raw = await this.syncPort.pull(query);
    logger.debug(`[Sync] SyncAndRebuildDailyNoteUseCase rawBytes=${raw.length}`);

    const payload = JSON.parse(raw) as RawPayload;
    logger.debug(
      `[Sync] SyncAndRebuildDailyNoteUseCase payload schema=${"schema_version" in payload ? payload.schema_version : "unknown"} tasks=${Array.isArray(payload) ? payload.length : payload.tasks?.length ?? 0}`,
    );

    const remoteEntries = generateTaskEntries(payload);
    logger.debug(
      `[UseCase] SyncAndRebuildDailyNoteUseCase remoteEntries count=${remoteEntries.length} roots=${this.countRootEntries(remoteEntries)}`,
    );

    // --- local entries ---
    const localJson = MarkdownToJsonUseCase.execute(note.content);
    logger.debug(`[UseCase] SyncAndRebuildDailyNoteUseCase localJsonBytes=${localJson.length}`);
    const localPayload = JSON.parse(localJson) as RawPayload;
    const localEntries = generateTaskEntries(localPayload);
    logger.debug(
      `[UseCase] SyncAndRebuildDailyNoteUseCase localEntries count=${localEntries.length} roots=${this.countRootEntries(localEntries)}`,
    );

    // --- merge ---
    const localTree = buildTaskTree(localEntries);

    const remoteTree = buildTaskTree(remoteEntries);

    const mergedTree = this.mergeService.merge(localTree, remoteTree);

    const rendered = renderTaskTree(mergedTree);
    logger.debug(
      `[UseCase] SyncAndRebuildDailyNoteUseCase rendered taskMarkdownBytes=${rendered.taskListMarkdown.length} taskKeys=${Object.keys(rendered.taskKeys).length}`,
    );

    // --- section rebuild ---
    const sectionMarkdown = PlannedTaskSectionBuilder.buildForToday({
      tasksMarkdown: rendered.taskListMarkdown,
      keepExistingHabits: true,
      runtime: this.runtime,
    });
    logger.debug(
      `[UseCase] SyncAndRebuildDailyNoteUseCase sectionMarkdownBytes=${sectionMarkdown.length}`,
    );

    adapter.replaceSection("daily.section.planned.title", sectionMarkdown);

    // --- phase update ---
    if (!adapter.getSyncPhase()) {
      adapter.setSyncPhase(SyncPhase.Working);
    }

    // --- taskKeys update ---
    adapter.replaceTaskKeys(rendered.taskKeys);

    const updated = note.withContent(adapter.toString());

    await this.repository.save(updated);

    logger.debug(
      `[UseCase:end] SyncAndRebuildDailyNoteUseCase date=${today} phase=${phase} remote=${remoteEntries.length} local=${localEntries.length} taskKeys=${Object.keys(rendered.taskKeys).length}`,
    );

    return updated;
  }

  private countRootEntries(entries: Array<Pick<TaskEntry, "parentId">>): number {
    return entries.filter((entry) => !entry.parentId).length;
  }
}
