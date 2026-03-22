import { NoteSummaries } from "../../../domain/note/NoteSummaries";
import { CreatedProjectNoteRepository } from "../../../infrastructure/repository/CreatedProjectNoteRepository";
import { ProjectNoteFrontmatterRepository } from "../../../infrastructure/repository/ProjectNoteFrontmatterRepository";
import { logger } from "../../../shared/logger/loggerInstance";

export class CollectCreatedNotesUseCase {
  constructor(
    private readonly createdRepo: CreatedProjectNoteRepository,
    private readonly noteRepo: ProjectNoteFrontmatterRepository,
  ) {}

  async execute(date: string): Promise<NoteSummaries> {
    logger.debug(`[UseCase:start] CollectCreatedNotesUseCase date=${date}`);

    const files = this.createdRepo.findByDate(date);
    const summaries = new NoteSummaries();

    for (const file of files) {
      summaries.add(await this.noteRepo.read(file));
    }

    logger.debug(`[UseCase:end] CollectCreatedNotesUseCase date=${date} count=${summaries.getAll().length}`);

    return summaries;
  }
}
