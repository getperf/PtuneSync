import { TFile } from "obsidian";
import { NoteSummaryGenerator } from "../services/NoteSummaryGenerator";

export class PreviewNoteSummaryUseCase {
  constructor(private readonly generator: NoteSummaryGenerator) {}

  async execute(file: TFile): Promise<string> {
    const sentences = await this.generator.generate(file);
    return sentences.join("\n");
  }
}
