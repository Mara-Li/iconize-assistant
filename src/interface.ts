export interface IconizeAssistantSettings {
	iconFolderPath: string;
}
export const DEFAULT_SETTINGS: IconizeAssistantSettings = {
	iconFolderPath: ".obsidian/.icons",
};

export interface Icon {
	name: string;
	path: string;
	prefix: string;
}

export interface IconFile {
	[filepath: string]: [iconName: string]
}

type rulesFor = "everything" | "files" | "folders";