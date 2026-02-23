import { App, PluginSettingTab, Setting } from "obsidian";
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

		new Setting(containerEl).setName("Icon folder path").addSearch((cb) => {
			cb.setPlaceholder("Folder").setValue(this.settings.iconFolderPath);
			new FolderSuggester(cb.inputEl, this.app, async (result) => {
				this.settings.iconFolderPath = result.trim();
				await this.plugin.saveSettings();
			});
		});

		new Setting(containerEl)
			.setName("Use iconic")
			.setDesc(
				"Use iconic settings (if using my-svgs or other plugin that allow custom icons)",
			)
			.addToggle((toggle) =>
				toggle.setValue(this.settings.useIconic).onChange(async (val) => {
					this.settings.useIconic = val;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setHeading()
			.setName("Icon File - Link into frontmatter");

		new Setting(containerEl).setName("Enable").addToggle((toggle) =>
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
				.setName("Name")
				.setDesc("Name in the frontmatter/properties")
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
				.setName("Hide")
				.setDesc(
					"Hide the key in Properties (in Live Preview or reading mode). The key continue to be visible in source mode.",
				)
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
			.setName("Icon Name - Name into frontmatter")
			.setDesc('Icon will be in the form of "folder/name".');

		new Setting(containerEl).setName("Enable").addToggle((toggle) =>
			toggle.setValue(this.settings.iconName.enable).onChange(async (value) => {
				this.settings.iconName.enable = value;
				await this.plugin.saveSettings();
				this.display();
				this.plugin.addCSS();
			}),
		);

		if (this.settings.iconName.enable) {
			new Setting(containerEl)
				.setName("Name")
				.setDesc("Name in the frontmatter/properties")
				.addText((text) =>
					text.setValue(this.settings.iconName.name).onChange(async (value) => {
						this.settings.iconName.name = value;
						await this.plugin.saveSettings();
						this.plugin.addCSS();
					}),
				);

			new Setting(containerEl)
				.setName("Hide")
				.setDesc(
					"Hide the key in Properties (in Live Preview or reading mode). The key continue to be visible in source mode.",
				)

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

		new Setting(containerEl)
			.setName("Allow regex")
			.setDesc(
				"Sometimes, you didn't want the inheritance of the icon (used with regex rules in Iconize).",
			)
			.addToggle((toggle) =>
				toggle.setValue(this.settings.allowRegex).onChange(async (value) => {
					this.settings.allowRegex = value;
					await this.plugin.saveSettings();
				}),
			);
	}
}
