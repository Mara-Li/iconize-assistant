export interface IconizeAssistantSettings {
	iconFolderPath: string;
	linkToFile: FrontmatterSettings;
	iconName: FrontmatterSettings;
	allowRegex: boolean;

	useIconic: boolean;
	createLucideFile: boolean;
	lucidePrefix: string;
}
export const DEFAULT_SETTINGS: IconizeAssistantSettings = {
	iconFolderPath: ".obsidian/.icons",
	linkToFile: {
		enable: true,
		name: "icon_file",
		hide: false,
	},
	iconName: {
		enable: true,
		name: "icon",
		hide: false,
	},
	allowRegex: true,
	useIconic: false,
	createLucideFile: false,
	lucidePrefix: "lucide",
};

export interface Icon {
	name: string;
	path: string;
	prefix: string;
}

type FrontmatterSettings = {
	enable: boolean;
	name: string;
	hide: boolean;
};
