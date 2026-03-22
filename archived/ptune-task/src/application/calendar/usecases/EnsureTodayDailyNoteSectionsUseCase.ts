import { TFile } from "obsidian";
import { PlannedTaskSectionBuilder } from "../../planning/builders/PlannedTaskSectionBuilder";
import { TodayResolver } from "../services/TodayResolver";
import { DailyNoteRepository } from "../../../infrastructure/repository/DailyNoteRepository";
import { DailyNoteDocumentAdapter } from "../../../infrastructure/document/adapter/DailyNoteDocumentAdapter";
import { PtuneRuntime } from "../../../shared/PtuneRuntime";

export class EnsureTodayDailyNoteSectionsUseCase {
	private static readonly SECTION_SEPARATOR = "---";

	constructor(
		private readonly todayResolver: TodayResolver,
		private readonly repository: DailyNoteRepository,
		private readonly runtime: PtuneRuntime,
	) {}

	async execute(file: TFile | null): Promise<boolean> {
		if (!file) {
			return false;
		}

		const today = this.todayResolver.resolve();
		const todayPath = this.runtime.resolveNoteUri(today);

		if (file.path !== todayPath) {
			return false;
		}

		const note = await this.repository.findByDate(today);

		if (!note) {
			return false;
		}

		const adapter = new DailyNoteDocumentAdapter(note.content);
		let updated = false;

		if (!adapter.hasSection("daily.section.planned.title")) {
			const sectionMarkdown = `${PlannedTaskSectionBuilder.buildForToday({
				runtime: this.runtime,
				keepExistingHabits: true,
			})}\n\n${EnsureTodayDailyNoteSectionsUseCase.SECTION_SEPARATOR}`;

			updated = adapter.upsertSection(
				"daily.section.planned.title",
				sectionMarkdown,
			) || updated;
		} else if (!adapter.hasSection("daily.section.timelog.title")) {
			const plannedMarkdown = adapter.getSectionMarkdown("daily.section.planned.title").trimEnd();
			if (!plannedMarkdown.endsWith(EnsureTodayDailyNoteSectionsUseCase.SECTION_SEPARATOR)) {
				adapter.mergeIntoSection(
					"daily.section.planned.title",
					EnsureTodayDailyNoteSectionsUseCase.SECTION_SEPARATOR,
				);
				updated = true;
			}
		}

		if (!adapter.hasSection("daily.section.timelog.title")) {
			updated = adapter.upsertSection(
				"daily.section.timelog.title",
				EnsureTodayDailyNoteSectionsUseCase.SECTION_SEPARATOR,
			) || updated;
		}

		if (!adapter.hasSection("daily.section.memo.title")) {
			updated = adapter.upsertSection(
				"daily.section.memo.title",
				EnsureTodayDailyNoteSectionsUseCase.SECTION_SEPARATOR,
			) || updated;
		}

		if (!updated) {
			return false;
		}

		await this.repository.save(note.withContent(adapter.toString()));

		return true;
	}
}
