import { DailyNote } from "../../../domain/daily/DailyNote";
import { DailyNoteRepository } from "../../../infrastructure/repository/DailyNoteRepository";
import { DailyNoteCreator } from "../services/DailyNoteCreator";

export class CreateDailyNoteUseCase {
  constructor(
    private readonly repository: DailyNoteRepository,
    private readonly creator: DailyNoteCreator,
  ) {}

  async execute(date: string): Promise<{ note: DailyNote; created: boolean }> {
    const existing = await this.repository.findByDate(date);

    if (existing) {
      return { note: existing, created: false };
    }

    const note = this.creator.create(date);

    await this.repository.save(note);

    return { note, created: true };
  }
}
