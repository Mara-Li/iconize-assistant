export interface IconFolderYamlSettings {
	iconFolderPath: string;
}
export const DEFAULT_SETTINGS: IconFolderYamlSettings = {
	iconFolderPath: ".obsidian/.icons",
};

export interface Icon {
	name: string;
	path: string;
	prefix: string;
}

export interface IconFile {
	[filepath: string] : [iconName: string]
}
