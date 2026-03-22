import { ReviewQuery } from "../../sync/shared/dto/ReviewQuery";
import { CreateDailyNoteUseCase } from "../../calendar/usecases/CreateDailyNoteUseCase";
import { DailyNoteRepository } from "../../../infrastructure/repository/DailyNoteRepository";
import { ReviewSectionWriter } from "../../../infrastructure/document/review/ReviewSectionWriter";
import { ReviewTaskDto } from "../dto/ReviewTaskDto";
import { logger } from "../../../shared/logger/loggerInstance";
import { DailyNote } from "../../../domain/daily/DailyNote";
import { DailyNoteDocumentAdapter } from "../../../infrastructure/document/adapter/DailyNoteDocumentAdapter";
import { ReviewTaskTree } from "../models/ReviewTaskTree";
import { PtuneSyncPort } from "../../sync/shared/ports/PtuneSyncPort";

export type GenerateReviewResult = {
  note: DailyNote;
  taskCount: number;
};

type ReviewResponse = {
  schema_version: number;
  list: string;
  exported_at: string;
  tasks: ReviewTaskDto[];
};

export class GenerateDailyReviewUseCase {
  constructor(
    private readonly ptuneSync: PtuneSyncPort,
    private readonly repository: DailyNoteRepository,
    private readonly createDailyNoteUseCase: CreateDailyNoteUseCase,
  ) {}

  async execute(date: string, list: string): Promise<GenerateReviewResult> {
    logger.info("GenerateDailyReviewUseCase started");

    // 1) review 取得
    const json = await this.ptuneSync.review({ list } as ReviewQuery);
    const parsed = JSON.parse(json) as ReviewResponse;

    const tasks = parsed.tasks ?? [];
    const tree = ReviewTaskTree.fromDtos(tasks);

    // 2) アクティブノート取得
    const { note } = await this.createDailyNoteUseCase.execute(date);

    // 3) セクション生成＆適用
    const now = new Date().toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const adapter = new DailyNoteDocumentAdapter(note.content);
    const writer = new ReviewSectionWriter(adapter);

    writer.appendReview(tree, now);

    // 4) 保存
    const updatedNote = note.withContent(adapter.toString());
    await this.repository.save(updatedNote);

    logger.info(
      `GenerateDailyReviewUseCase completed: ${tasks.length} tasks`,
    );

    return { note: updatedNote, taskCount: tasks.length };
  }
}
