import { TFile } from "obsidian";
import { TextGenerationPort } from "../../llm/ports/TextGenerationPort";
import { ProjectNoteFrontmatterRepository } from "../../../infrastructure/repository/ProjectNoteFrontmatterRepository";
import { buildNoteSummarySystemPrompt } from "../prompts/buildNoteSummaryPrompt";
import { logger } from "../../../shared/logger/loggerInstance";
import { NoteSummaryFormatter } from "./NoteSummaryFormatter";

export class NoteSummaryGenerator {
  private static readonly MAX_INPUT_CHARS = 12000;
  private static readonly EMPTY_BODY_SUMMARY = ["本文の記述なし。"];
  private readonly formatter = new NoteSummaryFormatter();

  constructor(
    private readonly generator: TextGenerationPort,
    private readonly repository: ProjectNoteFrontmatterRepository,
  ) {}

  async generate(file: TFile): Promise<string[]> {
    logger.debug(`[Service] NoteSummaryGenerator.generate start path=${file.path}`);

    const body = await this.repository.readBody(file);
    const normalizedBody = this.normalizeBody(body, file.path);
    if (!normalizedBody) {
      logger.warn(`[Service] NoteSummaryGenerator.generate emptyBody path=${file.path}`);
      return NoteSummaryGenerator.EMPTY_BODY_SUMMARY;
    }

    const output = await this.generator.generate(
      buildNoteSummarySystemPrompt(),
      normalizedBody,
    );
    const formatted = this.formatter.format(output?.trim() ?? "");

    if (formatted.length === 0) {
      throw new Error(`Empty summary generated for ${file.path}`);
    }

    logger.debug(`[Service] NoteSummaryGenerator.generate end path=${file.path}`);

    return formatted;
  }

  private normalizeBody(body: string, path: string): string {
    const normalized = body.trim();
    logger.debug(
      `[Service] NoteSummaryGenerator.generate bodyChars=${normalized.length} path=${path}`,
    );

    if (normalized.length <= NoteSummaryGenerator.MAX_INPUT_CHARS) {
      return normalized;
    }

    logger.warn(
      `[Service] NoteSummaryGenerator.generate bodyTruncated originalChars=${normalized.length} maxChars=${NoteSummaryGenerator.MAX_INPUT_CHARS} path=${path}`,
    );

    return normalized.slice(0, NoteSummaryGenerator.MAX_INPUT_CHARS);
  }
}
