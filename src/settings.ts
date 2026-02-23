import i18next from "i18next";
import { App, PluginSettingTab, Setting, sanitizeHTMLToDom } from "obsidian";
import { FolderSuggester } from "./folder";
import { IconizeAssistantSettings } from "./interface";
import IconizeAssistant from "./main";

export class IconizeAssistantTab extends PluginSettingTab {
	plugin: IconizeAssistant;
	settings: IconizeAssistantSettings;

	constructor(app: App, plugin: IconizeAssistant) {
		super(app, plugin);
		this.plugin = plugin;
		this.settings = plugin.settings;
	}

	display() {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName(i18next.t("settings.iconFolderPath"))
			.addSearch((cb) => {
				cb.setPlaceholder(i18next.t("settings.folder")).setValue(
					this.settings.iconFolderPath,
				);
				new FolderSuggester(cb.inputEl, this.app, async (result) => {
					this.settings.iconFolderPath = result.trim();
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName(i18next.t("settings.useIconic.title"))
			.setDesc(i18next.t("settings.useIconic.desc"))
			.addToggle((toggle) =>
				toggle.setValue(this.settings.useIconic).onChange(async (val) => {
					this.settings.useIconic = val;
					await this.plugin.saveSettings();
					this.display();
				}),
			);

		if (this.settings.useIconic) {
			new Setting(containerEl)
				.setName(i18next.t("settings.createFolder.title"))
				.setDesc(i18next.t("settings.createFolder.desc"))
				.addToggle((toggle) =>
					toggle
						.setValue(this.settings.createLucideFile)
						.onChange(async (value) => {
							this.settings.createLucideFile = value;
							await this.plugin.saveSettings();
							this.display();
						}),
				);

			if (this.settings.createLucideFile) {
				new Setting(containerEl)
					.setName(i18next.t("settings.lucidePrefix.title"))
					.setDesc(
						sanitizeHTMLToDom(
							i18next.t("settings.lucidePrefix.desc", {
								0: this.settings.iconFolderPath,
								1: this.settings.lucidePrefix,
							}),
						),
					)
					.addText((text) =>
						text.setValue(this.settings.lucidePrefix).onChange(async (val) => {
							this.settings.lucidePrefix = val;
							await this.plugin.saveSettings();
						}),
					);
			}
		}

		new Setting(containerEl)
			.setHeading()
			.setName(i18next.t("settings.iconFile.title"));

		new Setting(containerEl)
			.setName(i18next.t("settings.iconFile.enable.title"))
			.addToggle((toggle) =>
				toggle
					.setValue(this.settings.linkToFile.enable)
					.onChange(async (value) => {
						this.settings.linkToFile.enable = value;
						await this.plugin.saveSettings();
						this.display();
						this.plugin.addCSS();
					}),
			);

		if (this.settings.linkToFile.enable) {
			new Setting(containerEl)
				.setName(i18next.t("settings.linkToFile.title"))
				.setDesc(i18next.t("settings.linkToFile.desc"))
				.addText((text) =>
					text
						.setValue(this.settings.linkToFile.name)
						.onChange(async (value) => {
							this.settings.linkToFile.name = value;
							await this.plugin.saveSettings();
							this.plugin.addCSS();
						}),
				);

			new Setting(containerEl)
				.setName(i18next.t("settings.hide.title"))
				.setDesc(i18next.t("settings.hide.desc"))
				.addToggle((toggle) =>
					toggle
						.setValue(this.settings.linkToFile.hide)
						.onChange(async (value) => {
							this.settings.linkToFile.hide = value;
							await this.plugin.saveSettings();
							this.plugin.addCSS();
						}),
				);
		}

		new Setting(containerEl)
			.setHeading()
			.setName(i18next.t("settings.iconName.title"))
			.setDesc(i18next.t("settings.iconName.desc"));

		new Setting(containerEl)
			.setName(i18next.t("settings.iconFile.enable.title"))
			.addToggle((toggle) =>
				toggle
					.setValue(this.settings.iconName.enable)
					.onChange(async (value) => {
						this.settings.iconName.enable = value;
						await this.plugin.saveSettings();
						this.display();
						this.plugin.addCSS();
					}),
			);

		if (this.settings.iconName.enable) {
			new Setting(containerEl)
				.setName(i18next.t("settings.linkToFile.title"))
				.setDesc(i18next.t("settings.linkToFile.desc"))
				.addText((text) =>
					text.setValue(this.settings.iconName.name).onChange(async (value) => {
						this.settings.iconName.name = value;
						await this.plugin.saveSettings();
						this.plugin.addCSS();
					}),
				);

			new Setting(containerEl)
				.setName(i18next.t("settings.hide.title"))
				.setDesc(i18next.t("settings.hide.desc"))

				.addToggle((toggle) =>
					toggle
						.setValue(this.settings.iconName.hide)
						.onChange(async (value) => {
							this.settings.iconName.hide = value;
							await this.plugin.saveSettings();
							this.plugin.addCSS();
						}),
				);
		}
		if (!this.settings.useIconic)
			new Setting(containerEl)
				.setName(i18next.t("settings.regex.title"))
				.setDesc(i18next.t("settings.regex.desc"))
				.addToggle((toggle) =>
					toggle.setValue(this.settings.allowRegex).onChange(async (value) => {
						this.settings.allowRegex = value;
						await this.plugin.saveSettings();
					}),
				);

		new Setting(containerEl)
			.setHeading()
			.setName(i18next.t("settings.menu.title"));

		new Setting(containerEl)
			.setName(i18next.t("settings.editorMenu"))
			.addToggle((toggle) =>
				toggle.setValue(this.settings.addEditorMenu).onChange(async (value) => {
					this.settings.addEditorMenu = value;
					await this.plugin.saveSettings();
				}),
			);
		new Setting(containerEl)
			.setName(i18next.t("settings.fileMenu"))
			.addToggle((toggle) =>
				toggle.setValue(this.settings.addFileMenu).onChange(async (value) => {
					this.settings.addFileMenu = value;
					await this.plugin.saveSettings();
				}),
			);
	}
}
