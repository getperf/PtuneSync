import { config } from "../../../config/config";
import { DailyNote } from "../../../domain/daily/DailyNote";
import { NoteSummaries } from "../../../domain/note/NoteSummaries";
import { GenerateDailyNotesReviewUseCase } from "../usecases/GenerateDailyNotesReviewUseCase";

describe("GenerateDailyNotesReviewUseCase", () => {
  test("writes note list without summaries or reflection when llm-dependent output is disabled", async () => {
    const originalFormat = config.settings.review.reviewPointOutputFormat;
    config.settings.review.reviewPointOutputFormat = "outline";

    try {
      const createdFiles = [{ path: "_project/331_push時の差分ロジック見直し/01_新規作成で親見出し追加.md" }];
      const summaries = new NoteSummaries();
      summaries.add({
        noteFolder: "_project/331_push時の差分ロジック見直し",
        notePath: "_project/331_push時の差分ロジック見直し/01_新規作成で親見出し追加.md",
        noteTitle: "新規作成で親見出し追加",
        summary: "これは表示しない",
      });

      const note = new DailyNote("2026-03-16", "_journal/2026/03/2026-03-16.md", "before");
      const updated = note.withContent("after");

      const createDailyNoteUseCase = {
        execute: jest.fn().mockResolvedValue({ note, created: false }),
      };
      const dailyNoteRepository = {
        save: jest.fn().mockResolvedValue(undefined),
      };
      const collectUseCase = {
        execute: jest.fn().mockResolvedValue(summaries),
      };
      const createdRepo = {
        findByDate: jest.fn().mockReturnValue(createdFiles),
        hasSummary: jest.fn(),
      };
      const noteRepo = {
        saveSummary: jest.fn(),
      };
      const noteSummaryGenerator = {
        generate: jest.fn(),
      };
      const textGenerator = {
        generate: jest.fn(),
      };
      const writer = {
        write: jest.fn().mockReturnValue(updated),
      };
      const reviewPointXMindTemplateService = {
        ensureForDailyNote: jest.fn(),
      };
      const reportBuilder = {
        build: jest.fn().mockReturnValue(
          [
            "- push時の差分ロジック見直し",
            "  - [新規作成で親見出し追加](_project/331_push%E6%99%82%E3%81%AE%E5%B7%AE%E5%88%86%E3%83%AD%E3%82%B8%E3%83%83%E3%82%AF%E8%A6%8B%E7%9B%B4%E3%81%97/01_%E6%96%B0%E8%A6%8F%E4%BD%9C%E6%88%90%E3%81%A7%E8%A6%AA%E8%A6%8B%E5%87%BA%E3%81%97%E8%BF%BD%E5%8A%A0.md)",
          ].join("\n"),
        ),
      };

      const useCase = new GenerateDailyNotesReviewUseCase(
        createDailyNoteUseCase as never,
        dailyNoteRepository as never,
        collectUseCase as never,
        createdRepo as never,
        noteRepo as never,
        noteSummaryGenerator as never,
        textGenerator as never,
        writer as never,
        reportBuilder as never,
        reviewPointXMindTemplateService as never,
      );

      const result = await useCase.execute("2026-03-16", {
        reviewPointOutputFormat: "outline",
        enableSummaries: false,
        enableReflection: false,
      });

      expect(noteSummaryGenerator.generate).not.toHaveBeenCalled();
      expect(textGenerator.generate).not.toHaveBeenCalled();
      expect(reviewPointXMindTemplateService.ensureForDailyNote).not.toHaveBeenCalled();
      expect(reportBuilder.build).toHaveBeenCalledWith(
        summaries,
        { includeSummaries: false },
      );
      expect(writer.write).toHaveBeenCalledWith(
        note,
        [
          "- push時の差分ロジック見直し",
          "  - [新規作成で親見出し追加](_project/331_push%E6%99%82%E3%81%AE%E5%B7%AE%E5%88%86%E3%83%AD%E3%82%B8%E3%83%83%E3%82%AF%E8%A6%8B%E7%9B%B4%E3%81%97/01_%E6%96%B0%E8%A6%8F%E4%BD%9C%E6%88%90%E3%81%A7%E8%A6%AA%E8%A6%8B%E5%87%BA%E3%81%97%E8%BF%BD%E5%8A%A0.md)",
        ].join("\n"),
        "",
      );
      expect(dailyNoteRepository.save).toHaveBeenCalledWith(updated);
      expect(result).toEqual({
        note: updated,
        noteCount: 1,
        generatedCount: 0,
      });
    } finally {
      config.settings.review.reviewPointOutputFormat = originalFormat;
    }
  });

  test("creates xmind template link when review point format is xmind", async () => {
    const originalFormat = config.settings.review.reviewPointOutputFormat;
    const originalSentenceMode = config.settings.review.sentenceMode;
    config.settings.review.reviewPointOutputFormat = "xmind";
    config.settings.review.sentenceMode = "none";

    try {
      const summaries = new NoteSummaries();
      summaries.add({
        noteFolder: "_project/331_push時の差分ロジック見直し",
        notePath: "_project/331_push時の差分ロジック見直し/01_新規作成で親見出し追加.md",
        noteTitle: "新規作成で親見出し追加",
        summary: "親見出しの追加手順を確認した",
      });

      const note = new DailyNote("2026-03-16", "_journal/2026/03/2026-03-16.md", "before");
      const updated = note.withContent("after");

      const createDailyNoteUseCase = {
        execute: jest.fn().mockResolvedValue({ note, created: false }),
      };
      const dailyNoteRepository = {
        save: jest.fn().mockResolvedValue(undefined),
      };
      const collectUseCase = {
        execute: jest.fn().mockResolvedValue(summaries),
      };
      const createdRepo = {
        findByDate: jest.fn().mockReturnValue([{ path: summaries.getAll()[0].notePath }]),
        hasSummary: jest.fn(),
      };
      const noteRepo = {
        saveSummary: jest.fn(),
      };
      const noteSummaryGenerator = {
        generate: jest.fn(),
      };
      const textGenerator = {
        generate: jest.fn(),
      };
      const writer = {
        write: jest.fn().mockReturnValue(updated),
      };
      const reportBuilder = {
        build: jest.fn().mockReturnValue("- push時の差分ロジック見直し"),
      };
      const reviewPointXMindTemplateService = {
        ensureForDailyNote: jest.fn().mockResolvedValue({
          vaultPath: "_journal/2026/03/2026-03-16_reviewpoint.xmind",
          markdownLinkPath: "_journal/2026/03/2026-03-16_reviewpoint.xmind",
          created: true,
        }),
      };

      const useCase = new GenerateDailyNotesReviewUseCase(
        createDailyNoteUseCase as never,
        dailyNoteRepository as never,
        collectUseCase as never,
        createdRepo as never,
        noteRepo as never,
        noteSummaryGenerator as never,
        textGenerator as never,
        writer as never,
        reportBuilder as never,
        reviewPointXMindTemplateService as never,
      );

      await useCase.execute("2026-03-16", {
        reviewPointOutputFormat: "xmind",
        enableSummaries: false,
        enableReflection: true,
      });

      expect(reviewPointXMindTemplateService.ensureForDailyNote).toHaveBeenCalledWith(note);
      expect(writer.write).toHaveBeenCalledWith(
        note,
        "- push時の差分ロジック見直し",
        expect.stringContaining("[編集用 XMind ファイルを開く](_journal/2026/03/2026-03-16_reviewpoint.xmind)"),
      );
    } finally {
      config.settings.review.reviewPointOutputFormat = originalFormat;
      config.settings.review.sentenceMode = originalSentenceMode;
    }
  });
});
