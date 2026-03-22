export type TaskTriggerKind = "tag" | "goal" | "pomodoro" | "subtask";

export interface TaskTriggerMatch {
	kind: TaskTriggerKind;
	trigger: string;
	query: string;
	startCh: number;
}

const INLINE_TRIGGERS: ReadonlyArray<{
	kind: Exclude<TaskTriggerKind, "subtask">;
	trigger: string;
}> = [
		{ kind: "tag", trigger: "##" },
		{ kind: "goal", trigger: "||" },
		{ kind: "pomodoro", trigger: "::" },
	];

export function detectTaskTrigger(prefix: string): TaskTriggerMatch | null {
	for (const candidate of INLINE_TRIGGERS) {
		const index = prefix.lastIndexOf(candidate.trigger);

		if (index < 0) {
			continue;
		}

		const query = prefix.slice(index + candidate.trigger.length);

		if (/\s/.test(query)) {
			continue;
		}

		return {
			kind: candidate.kind,
			trigger: candidate.trigger,
			query,
			startCh: index,
		};
	}

	if (prefix.endsWith(";;")) {
		return {
			kind: "subtask",
			trigger: ";;",
			query: "",
			startCh: prefix.length - 2,
		};
	}

	return null;
}
