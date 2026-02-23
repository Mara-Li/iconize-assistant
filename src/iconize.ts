import type { App, TFile } from "obsidian";
import type { IconizeAssistantSettings } from "./interface";
import type IconizeAssistant from "./main";

export type Rule = {
	rule: string;
	icon: string;
	for?: "everything" | "files" | "folders";
	order: number;
	color?: string;
	useFilePath?: boolean;
};

export type IconFile = Record<string, string>;

export class Iconize {
	app: App;
	settings: IconizeAssistantSettings;
	plugin: IconizeAssistant;

	constructor(app: App, plugin: IconizeAssistant) {
		this.app = app;
		this.settings = plugin.settings;
		this.plugin = plugin;
	}

	private searchIfApplicable(rules: Rule[], path: string): undefined | Rule {
		if (!this.settings.allowRegex) return undefined;
		return rules.find((rule: any) => {
			const regex = new RegExp(rule.rule);
			return (
				(rule.for === "everything" || rule.for === "files") && regex.test(path)
			);
		});
	}

	async getFileIcon(file: TFile) {
		const data = await this.loadData();
		if (!data) return;
		const { icon } = data;
		const path = file.path;
		const isFolder = this.plugin.findFolderNote(file)?.path;
		const fileIcon = icon[path];
		if (fileIcon) return fileIcon;
		if (isFolder && icon[isFolder]) return icon[isFolder];
		const rule = this.searchIfApplicable(data.rules, file.path);
		if (rule?.icon) return rule.icon;
		return null;
	}

	private async loadData() {
		const obsidianIconFolder = this.app.plugins.getPlugin(
			"obsidian-icon-folder",
		);
		const data = await obsidianIconFolder?.loadData();
		if (!data) return;
		const rules = data.settings.rules as Rule[];
		//remove "settings" from data
		delete data.settings;
		const icon = data as IconFile;
		return { rules, icon };
	}
}
