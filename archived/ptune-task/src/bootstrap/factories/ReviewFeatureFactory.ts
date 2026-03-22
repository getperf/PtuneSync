import { App } from "obsidian";
import { NoteSummaryGenerator } from "../../application/note_review/services/NoteSummaryGenerator";
import { PreviewNoteSummaryUseCase } from "../../application/note_review/usecases/PreviewNoteSummaryUseCase";
import { SaveNoteSummaryUseCase } from "../../application/note_review/usecases/SaveNoteSummaryUseCase";
import { LlmClient } from "../../infrastructure/llm/LlmClient";
import { ProjectNoteFrontmatterRepository } from "../../infrastructure/repository/ProjectNoteFrontmatterRepository";
import { NoteReviewFeature } from "../../presentation/note_review/NoteReviewFeature";

export class ReviewFeatureFactory {
  constructor(private readonly app: App) {}

  createNoteReviewFeature(): NoteReviewFeature {
    const llm = new LlmClient();
    const repo = new ProjectNoteFrontmatterRepository(this.app);
    const generator = new NoteSummaryGenerator(llm, repo);

    return new NoteReviewFeature(
      this.app,
      llm,
      new PreviewNoteSummaryUseCase(generator),
      new SaveNoteSummaryUseCase(repo),
    );
  }
}
