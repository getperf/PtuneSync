import { TFile } from "obsidian";
import { ProjectNoteFrontmatterRepository } from "../../../infrastructure/repository/ProjectNoteFrontmatterRepository";

export class SaveNoteSummaryUseCase {
  constructor(private readonly repository: ProjectNoteFrontmatterRepository) {}

  async execute(file: TFile, summary: string): Promise<void> {
    await this.repository.saveSummary(file, summary);
  }
}
