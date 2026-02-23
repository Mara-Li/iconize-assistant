/**
 * @credit gfxholo
 *
 */

import type { App, TFile } from "obsidian";
import type IconizeAssistant from "./main";

type Rules = {
	id?: string;
	name?: string;
	icon?: string;
	color?: string;
	match?: string;
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

	constructor(app: App, plugin: IconizeAssistant) {
		this.app = app;
		this.plugin = plugin;
	}

	private unwrapRegex(value: string): RegExp {
		return value.startsWith("/") && value.endsWith("/")
			? new RegExp(value.slice(1, -1))
			: new RegExp(value);
	}
	/**
	 * Check whether any items match a given operator & value.
	 */

	private any(
		items: (string | null)[],
		operator: "are" | "contain" | "startWith" | "endWith" | "match",
		value: string,
	): boolean {
		if (value === "") return false;

		switch (operator) {
			case "are":
				for (const item of items) if (item === value) return true;
				break;
			case "contain":
				for (const item of items) if (String(item).includes(value)) return true;
				break;
			case "startWith":
				for (const item of items)
					if (String(item).startsWith(value)) return true;
				break;
			case "endWith":
				for (const item of items) if (String(item).endsWith(value)) return true;
				break;
			case "match": {
				try {
					const regex = this.unwrapRegex(value);
					for (const item of items) {
						if (regex.test(String(item))) return true;
					}
				} catch {
					/* Catch invalid regex */
				}
				break;
			}
		}
		return false;
	}

	private searchIfApplicable(
		fileRules: Rules[],
		path: string,
	): undefined | Rules {
		return fileRules.find((rule: any) => {
			return rule.enabled && this.any([path], rule.operator, rule.value);
		});
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
		const rule = this.searchIfApplicable(rules, file.path);
		if (rule?.icon) return rule.icon;
		return null;
	}
}
