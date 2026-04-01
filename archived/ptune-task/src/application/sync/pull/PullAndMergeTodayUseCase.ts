// src/application/sync/pull/PullAndMergeTodayUseCase.ts

import { DailyNote } from "../../../domain/daily/DailyNote";
import { DailyNoteRepository } from "../../../infrastructure/repository/DailyNoteRepository";
import { logger } from "../../../shared/logger/loggerInstance";
import { TodayResolver } from "../../calendar/services/TodayResolver";
import { CreateDailyNoteUseCase } from "../../calendar/usecases/CreateDailyNoteUseCase";
import { PtuneSyncPort } from "../shared/ports/PtuneSyncPort";

import { generateTaskEntries } from "../../planning/services/generateTaskEntries";
import { buildTaskTree } from "../../planning/services/buildTaskTree";
import { renderTaskTree } from "../../planning/services/renderTaskTree";
import { MarkdownToJsonUseCase } from "../../planning/usecases/MarkdownToJsonUseCase";
import { MergeTaskTreeService } from "../merge/MergeTaskTreeService";
import { DailyNoteDocumentAdapter } from "../../../infrastructure/document/adapter/DailyNoteDocumentAdapter";
import { TaskDocumentFactory } from "../../../domain/task/TaskDocument";
import { TaskEntryNormalizer } from "../shared/normalizers/TaskEntryNormalizer";
import { PtuneRuntime } from "../../../shared/PtuneRuntime";
import { PlannedTaskSectionBuilder } from "../../planning/builders/PlannedTaskSectionBuilder";
import { SyncPhase } from "../../../domain/task/SyncPhase";
import { HabitService } from "../../../domain/task/HabitService";
import type { TaskEntry } from "../../../domain/task/TaskEntry";
import type { RawPayload } from "../../../infrastructure/conversion/task/json/JsonToEntries";
import { getDefaultTaskListId } from "../shared/DefaultTaskListId";
import { i18n } from "../../../shared/i18n/I18n";

export class PullAndMergeTodayUseCase {
  constructor(
    private readonly syncPort: PtuneSyncPort,
    private readonly todayResolver: TodayResolver,
    private readonly repository: DailyNoteRepository,
    private readonly createDailyNoteUseCase: CreateDailyNoteUseCase,
    private readonly runtime: PtuneRuntime,
    private readonly mergeService: MergeTaskTreeService = new MergeTaskTreeService(),
  ) {}

  async execute(): Promise<{ note: DailyNote; created: boolean }> {
    logger.debug("[UseCase:start] PullAndMergeTodayUseCase");

    const today = this.todayResolver.resolve();
    logger.debug(`[UseCase] PullAndMergeTodayUseCase date=${today}`);

    let note = await this.repository.findByDate(today);
    let created = false;

    if (!note) {
      const result = await this.createDailyNoteUseCase.execute(today);

      note = result.note;
      created = true;
    }

    const adapter = new DailyNoteDocumentAdapter(note.content);

    const phase = adapter.getSyncPhase() ?? SyncPhase.Planning;
    logger.debug(`[UseCase] PullAndMergeTodayUseCase phase=${phase} created=${created}`);

    const raw = await this.syncPort.pull({
      list: getDefaultTaskListId(),
      includeCompleted: phase === SyncPhase.Working,
    });

    logger.debug(`[Sync] PullAndMergeTodayUseCase rawBytes=${raw.length}`);
    const payload = JSON.parse(raw) as RawPayload;
    logger.debug(
      `[Sync] PullAndMergeTodayUseCase payload schema=${"schema_version" in payload ? payload.schema_version : "unknown"} tasks=${Array.isArray(payload) ? payload.length : payload.tasks?.length ?? 0}`,
    );

    const habits = this.runtime.getHabitTasks();

    const habitSet = new Set([...habits.morning, ...habits.evening]);
    logger.debug(
      `[UseCase] PullAndMergeTodayUseCase habits morning=${habits.morning.length} evening=${habits.evening.length} unique=${habitSet.size}`,
    );

    // --- Google entries ---
    const googleEntriesRaw = generateTaskEntries(payload);

    const googleEntries = HabitService.filterEntries(
      googleEntriesRaw,
      habitSet,
    );

    logger.debug(
      `[UseCase] PullAndMergeTodayUseCase remoteEntries raw=${googleEntriesRaw.length} filtered=${googleEntries.length} roots=${this.countRootEntries(googleEntries)}`,
    );
    const googleTree = buildTaskTree(googleEntries);

    // --- Local parse ---
    const localJson = MarkdownToJsonUseCase.execute(note.content);
    logger.debug(`[UseCase] PullAndMergeTodayUseCase localJsonBytes=${localJson.length}`);

    const taskDoc = TaskDocumentFactory.fromJson(localJson);

    const localEntriesRaw = TaskEntryNormalizer.toDomain(taskDoc);

    const localEntries = HabitService.filterEntries(localEntriesRaw, habitSet);

    logger.debug(
      `[UseCase] PullAndMergeTodayUseCase localEntries raw=${localEntriesRaw.length} filtered=${localEntries.length} roots=${this.countRootEntries(localEntries)}`,
    );
    const localTree = buildTaskTree(localEntries);

    // --- Merge ---
    const mergedTree = this.mergeService.merge(localTree, googleTree);

    // --- Render ---
    const rendered = renderTaskTree(mergedTree);
    logger.debug(
      `[UseCase] PullAndMergeTodayUseCase rendered taskMarkdownBytes=${rendered.taskListMarkdown.length} taskKeys=${Object.keys(rendered.taskKeys).length}`,
    );
    const plannedSectionMarkdown = adapter.getSectionMarkdown("daily.section.planned.title");
    const plannedLines = plannedSectionMarkdown.split("\n");
    const existingMorningHabits = HabitService.collectExistingHabits(
      plannedLines,
      habits.morning,
    );
    const existingEveningHabits = HabitService.collectExistingHabits(
      plannedLines,
      habits.evening,
    );
    logger.debug(
      `[UseCase] PullAndMergeTodayUseCase existingHabits morning=${existingMorningHabits.length} evening=${existingEveningHabits.length}`,
    );

    // --- Section build ---
    const sectionMarkdown = PlannedTaskSectionBuilder.build({
      commentLine1: i18n.common.daily.planned.comment.line1,
      commentLine2: i18n.common.daily.planned.comment.line2,
      tasksMarkdown: rendered.taskListMarkdown,
      morningHabits: existingMorningHabits,
      eveningHabits: existingEveningHabits,
      keepExistingHabits: false,
    });
    logger.debug(
      `[UseCase] PullAndMergeTodayUseCase sectionMarkdownBytes=${sectionMarkdown.length}`,
    );
    adapter.replaceSection("daily.section.planned.title", sectionMarkdown);

    adapter.replaceTaskKeys(rendered.taskKeys);

    const updated = note.withContent(adapter.toString());

    await this.repository.save(updated);

    logger.debug(
      `[UseCase:end] PullAndMergeTodayUseCase date=${today} created=${created} remote=${googleEntries.length} local=${localEntries.length} taskKeys=${Object.keys(rendered.taskKeys).length}`,
    );

    return { note: updated, created };
  }

  private countRootEntries(entries: Array<Pick<TaskEntry, "parentId">>): number {
    return entries.filter((entry) => !entry.parentId).length;
  }
}
