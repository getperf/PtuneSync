import { LogLevel } from "config/types";
import { Vault, normalizePath } from "obsidian";

const LEVEL_PRIORITY: Record<LogLevel, number> = {
	debug: 10,
	info: 20,
	warn: 30,
	error: 40,
	none: 100,
};

export class Logger {
	private level: LogLevel = "info";

	private vault?: Vault;

	private enableFile = false;

	private logDir = "";

	configure(level: LogLevel, enableFile: boolean) {
		this.level = level;

		this.enableFile = enableFile;
	}

	initializeVault(vault: Vault) {
		this.vault = vault;

		this.logDir = normalizePath(
			`${vault.configDir}/plugins/ptune-task/logs`,
		);
	}

	private shouldLog(level: LogLevel): boolean {
		return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[this.level];
	}

	private getLogFile(): string {
		const d = new Date();

		const y = d.getFullYear();

		const m = String(d.getMonth() + 1).padStart(2, "0");

		const day = String(d.getDate()).padStart(2, "0");

		return normalizePath(`${this.logDir}/ptune-task_${y}-${m}-${day}.log`);
	}

	private async writeFile(level: LogLevel, msg: string) {
		if (!this.enableFile || !this.vault) return;

		const line = `[${new Date().toISOString()}][${level}] ${msg}\n`;

		try {
			await this.vault.adapter.append(this.getLogFile(), line);
		} catch {
			/* ignore */
		}
	}

	private log(level: LogLevel, ...args: unknown[]) {
		if (!this.shouldLog(level)) return;

		const msg = args
			.map((v) => (typeof v === "string" ? v : JSON.stringify(v)))
			.join(" ");

		const line = `[ptune][${level}] ${msg}`;

		switch (level) {
			case "debug":
			case "info":
				console.debug(line);
				break;

			case "warn":
				console.warn(line);
				break;

			case "error":
				console.error(line);
				break;
		}

		void this.writeFile(level, msg);
	}

	debug(...args: unknown[]) {
		this.log("debug", ...args);
	}

	info(...args: unknown[]) {
		this.log("info", ...args);
	}

	warn(...args: unknown[]) {
		this.log("warn", ...args);
	}

	error(...args: unknown[]) {
		this.log("error", ...args);
	}
}
