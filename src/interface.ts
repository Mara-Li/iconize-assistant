export interface IconizeAssistantSettings {
	iconFolderPath: string;
	linkToFile: FrontmatterSettings;
	iconName: FrontmatterSettings;
	allowRegex: boolean;
}
export const DEFAULT_SETTINGS: IconizeAssistantSettings = {
	iconFolderPath: ".obsidian/.icons",
	linkToFile: {
		enable: true,
		name: "icon_file",
		hide: false
	},
	iconName: {
		enable: true,
		name: "icon",
		hide: false
	},
	allowRegex: true
};

export interface Icon {
	name: string;
	path: string;
	prefix: string;
}

export interface IconFile {
	[filepath: string]: [iconName: string]
}

export type Rule = {
	rule: string;
	icon: string;
	for?: "everything" | "files" | "folders";
	order: number;
	color?: string;
	useFilePath?: boolean;


}

type FrontmatterSettings = {
	enable: boolean;
	name: string;
	hide: boolean;
}