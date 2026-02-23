/**
 * @credit gfxholo
 *
 */

import type { App, Plugin, TFile } from "obsidian";
import type IconizeAssistant from "./main";

type Rules = {
	id?: string;
	name?: string;
	icon?: string;
	color?: string;
	match?: "all" | "any" | "none";
	conditions?: Array<{
		source?: string;
		operator?: string;
		value?: string;
	}>;
	enabled?: boolean;
};

type FileIcons = Record<
	string,
	{
		icon?: string;
		color?: string;
		unsynced?: string[];
	}
>;

export class Iconic {
	app: App;
	plugin: IconizeAssistant;
	iconic: Plugin;

	constructor(app: App, plugin: IconizeAssistant) {
		this.app = app;
		this.plugin = plugin;
		const iconic = this.app.plugins.getPlugin("iconic");
		if (!iconic) throw new Error("Iconic is not found");
		this.iconic = iconic;
	}

	getFileItemFromTFile(tfile: TFile) {
		//@ts-ignore
		const items = this.iconic.getFileItems?.() ?? [];
		for (const it of items) {
			// Iconic utilise splitFilePath(fileItem.id) pour obtenir path
			//@ts-ignore
			const split = this.iconic.splitFilePath?.(it.id);
			if (split?.path === tfile.path) return it;
		}
		return null;
	}

	private searchIfApplicable(
		fileRules: Rules[],
		file: TFile,
	): undefined | Rules {
		const fileItem = this.getFileItemFromTFile(file);
		for (const rule of fileRules) {
			//@ts-ignore
			if (this.iconic.ruleManager.judgeFile(fileItem, rule, Date())) {
				return rule;
			}
		}
	}
	private async loadData() {
		const iconicIconFolder = this.app.plugins.getPlugin("iconic");
		if (!iconicIconFolder) return null;
		const settings = await iconicIconFolder.loadData();
		const fileRules = settings.fileRules as Rules[];
		const folderRules = settings.folderRules as Rules[];
		const rules = [...fileRules, ...folderRules];
		const fileIcons = settings.fileIcons as FileIcons;
		return { rules, fileIcons };
	}

	async getFileIcon(file: TFile) {
		const data = await this.loadData();
		if (!data) return;
		const { rules, fileIcons } = data;
		const path = file.path;
		const isFolder = this.plugin.findFolderNote(file)?.path;
		const fileIcon = fileIcons?.[path];
		if (fileIcon?.icon) return fileIcon.icon;
		if (isFolder && fileIcons[isFolder]?.icon) return fileIcons[isFolder].icon;
		const rule = this.searchIfApplicable(rules, file);
		if (rule?.icon) return rule.icon;
		return null;
	}
}
