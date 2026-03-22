import { Plugin } from "obsidian";

import { config } from "./config/config";
import { logger } from "./shared/logger/loggerInstance";
import { PtuneSettingTab } from "config/SettingsTab";
import { i18n } from "./shared/i18n/I18n";
import { Container } from "./bootstrap/container";
import { registerAllCommands } from "./bootstrap/commandRegistrar";
import { registerEditorFeatures } from "./bootstrap/registerEditorFeatures";
import { registerWorkspaceFeatures } from "./bootstrap/registerWorkspaceFeatures";

export default class PtunePlugin extends Plugin {
	async onload() {
		await config.load(this);

		i18n.init(config.settings.language);

		logger.initializeVault(this.app.vault);

		logger.configure(
			config.settings.logLevel,
			config.settings.enableLogFile,
		);

		const container = new Container(this.app);
		registerAllCommands(this, container);
		registerEditorFeatures(this);
		registerWorkspaceFeatures(this, container);
		container.createLayoutReadyHook().start();
		container.createDailyNoteOpenHook().start(this);

		logger.debug("ptune-task loaded");
		this.addSettingTab(new PtuneSettingTab(this.app, this));
	}
}
