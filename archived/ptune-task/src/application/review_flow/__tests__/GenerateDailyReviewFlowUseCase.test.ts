import { DailyNote } from "../../../domain/daily/DailyNote";
import { CreateDailyNoteUseCase } from "../../calendar/usecases/CreateDailyNoteUseCase";
import { GenerateDailyNotesReviewUseCase } from "../../daily_notes_review/usecases/GenerateDailyNotesReviewUseCase";
import { TextGenerationPort } from "../../llm/ports/TextGenerationPort";
import { GenerateDailyReviewUseCase } from "../../review/usecases/GenerateDailyReviewUseCase";
import { getDefaultTaskListId } from "../../sync/shared/DefaultTaskListId";
import { GenerateDailyReviewFlowUseCase } from "../usecases/GenerateDailyReviewFlowUseCase";

describe("GenerateDailyReviewFlowUseCase", () => {
  test("can skip both reviews independently", async () => {
    const note = new DailyNote("2026-03-16", "daily/2026-03-16.md", "");
    const taskReviewUseCase = {
      execute: jest.fn(),
    } as unknown as GenerateDailyReviewUseCase;
    const dailyNotesReviewUseCase = {
      execute: jest.fn(),
    } as unknown as GenerateDailyNotesReviewUseCase;
    const createDailyNoteUseCase = {
      execute: jest.fn().mockResolvedValue({ note, created: false }),
    } as unknown as CreateDailyNoteUseCase;
    const textGenerator = {
      hasValidApiKey: jest.fn().mockReturnValue(true),
    } as unknown as TextGenerationPort;

    const useCase = new GenerateDailyReviewFlowUseCase(
      taskReviewUseCase,
      dailyNotesReviewUseCase,
      createDailyNoteUseCase,
      textGenerator,
    );

    const result = await useCase.execute({
      date: "2026-03-16",
      taskReviewEnabled: false,
      dailyNotesReviewEnabled: false,
      reviewPointOutputFormat: "outline",
    });

    expect(taskReviewUseCase.execute).not.toHaveBeenCalled();
    expect(dailyNotesReviewUseCase.execute).not.toHaveBeenCalled();
    expect(createDailyNoteUseCase.execute).toHaveBeenCalledWith("2026-03-16");
    expect(result).toEqual({
      note,
      taskReview: {
        executed: false,
        taskCount: 0,
      },
      dailyNotesReview: {
        executed: false,
        noteCount: 0,
        generatedCount: 0,
        skippedReason: "disabled",
      },
    });
  });

  test("runs daily notes review without llm summaries when llm is unavailable", async () => {
    const taskNote = new DailyNote("2026-03-16", "daily/2026-03-16.md", "");
    const taskReviewUseCase = {
      execute: jest.fn().mockResolvedValue({ note: taskNote, taskCount: 2 }),
    } as unknown as GenerateDailyReviewUseCase;
    const dailyNotesReviewUseCase = {
      execute: jest.fn().mockResolvedValue({
        note: taskNote,
        noteCount: 3,
        generatedCount: 0,
      }),
    } as unknown as GenerateDailyNotesReviewUseCase;
    const createDailyNoteUseCase = {
      execute: jest.fn(),
    } as unknown as CreateDailyNoteUseCase;
    const textGenerator = {
      hasValidApiKey: jest.fn().mockReturnValue(false),
    } as unknown as TextGenerationPort;

    const useCase = new GenerateDailyReviewFlowUseCase(
      taskReviewUseCase,
      dailyNotesReviewUseCase,
      createDailyNoteUseCase,
      textGenerator,
    );

    const result = await useCase.execute({
      date: "2026-03-16",
      taskReviewEnabled: true,
      dailyNotesReviewEnabled: true,
      reviewPointOutputFormat: "outline",
    });

    expect(taskReviewUseCase.execute).toHaveBeenCalledWith(
      "2026-03-16",
      getDefaultTaskListId(),
    );
    expect(dailyNotesReviewUseCase.execute).toHaveBeenCalledWith(
      "2026-03-16",
      expect.objectContaining({
        reviewPointOutputFormat: "outline",
        enableSummaries: false,
        enableReflection: false,
      }),
    );
    expect(result).toEqual({
      note: taskNote,
      taskReview: {
        executed: true,
        taskCount: 2,
      },
      dailyNotesReview: {
        executed: true,
        noteCount: 3,
        generatedCount: 0,
      },
    });
  });

  test("runs daily notes review with selected format", async () => {
    const taskNote = new DailyNote("2026-03-16", "daily/2026-03-16.md", "task");
    const finalNote = new DailyNote("2026-03-16", "daily/2026-03-16.md", "final");
    const taskReviewUseCase = {
      execute: jest.fn().mockResolvedValue({ note: taskNote, taskCount: 5 }),
    } as unknown as GenerateDailyReviewUseCase;
    const dailyNotesReviewUseCase = {
      execute: jest.fn().mockResolvedValue({
        note: finalNote,
        noteCount: 4,
        generatedCount: 3,
      }),
    } as unknown as GenerateDailyNotesReviewUseCase;
    const createDailyNoteUseCase = {
      execute: jest.fn(),
    } as unknown as CreateDailyNoteUseCase;
    const textGenerator = {
      hasValidApiKey: jest.fn().mockReturnValue(true),
    } as unknown as TextGenerationPort;

    const useCase = new GenerateDailyReviewFlowUseCase(
      taskReviewUseCase,
      dailyNotesReviewUseCase,
      createDailyNoteUseCase,
      textGenerator,
    );

    const result = await useCase.execute({
      date: "2026-03-16",
      taskReviewEnabled: true,
      dailyNotesReviewEnabled: true,
      reviewPointOutputFormat: "xmind",
    });

    expect(dailyNotesReviewUseCase.execute).toHaveBeenCalledWith(
      "2026-03-16",
      expect.objectContaining({
        reviewPointOutputFormat: "xmind",
      }),
    );
    expect(result).toEqual({
      note: finalNote,
      taskReview: {
        executed: true,
        taskCount: 5,
      },
      dailyNotesReview: {
        executed: true,
        noteCount: 4,
        generatedCount: 3,
      },
    });
  });
});
