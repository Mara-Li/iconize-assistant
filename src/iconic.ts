/**
 * @credit gfxholo
 *
 */

import type { App } from "obsidian";

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

type FileIcons = {
	icon?: string;
	color?: string;
	unsynced?: string[];
};

export class IconicAssistant {
	/**
	 * Check whether any items match a given operator & value.
	 */
	app: App;

	constructor(app: App) {
		this.app = app;
	}

	private unwrapRegex(value: string): RegExp {
		return value.startsWith("/") && value.endsWith("/")
			? new RegExp(value.slice(1, -1))
			: new RegExp(value);
	}
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

	searchIfApplicable(fileRules: Rules[], path: string): undefined | Rules {
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

	async iconFolderPath() {
		const mySvgs = this.app.plugins.getPlugin("my-svgs");
		if (!mySvgs) return null;
		const data = await mySvgs.loadData();
		return data.customFolderPath ?? ".obsidian/.icons";
	}
}
