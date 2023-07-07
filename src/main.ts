import {Plugin, TFile} from "obsidian";
import {DEFAULT_SETTINGS, IconFile, IconFolderYamlSettings} from "./interface";
import {App} from "obsidian-undocumented";

export default class IconFolderYaml extends Plugin {
	settings: IconFolderYamlSettings;
	
	createIconPackPrefix(iconPackName: string):string {
		if (iconPackName.includes("-")) {
			const splitted = iconPackName.split("-");
			let result = splitted[0].charAt(0).toUpperCase();
			for (let i = 1; i < splitted.length; i++) {
				result += splitted[i].charAt(0).toLowerCase();
			}
			return result;
		}
		return iconPackName.charAt(0).toUpperCase() + iconPackName.charAt(1).toLowerCase();
	}
	
	async getFileIcons(file: TFile) {
		//get icons folder from another obsidian plugin
		const obsidianIconFolder = (this.app as App).plugins.getPlugin("obsidian-icon-folder");
		const data = await obsidianIconFolder.loadData();
		const iconFolder = data.settings.iconPacksPath;
		//remove "settings" from data
		delete data.settings;
		const icons = data as IconFile;
		const fileIcon = icons[file.path].toString();
		if (fileIcon) {
			const iconPack = (await this.app.vault.adapter.list(iconFolder)).folders;
			const allPackPrefix = iconPack.map(pack => {
				return {
					pack: pack,
					prefix: this.createIconPackPrefix(pack.split("/").pop() as string)
				};
			});
			const packPrefix = allPackPrefix.find(pack => {
				return fileIcon.includes(pack.prefix);
			});
			if (packPrefix) {
				const iconPath = `${packPrefix.pack}/${fileIcon.replace(packPrefix.prefix, "")}`;
				//remove obsidian folder from path
				return iconPath.replace(iconFolder + "/", "");
			}
		}
		return null;
	}
	
	async editFrontmatter(file: TFile, icon: string) {
		await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
			frontmatter.icon = icon;
		});
	}
	
	async onload() {
		console.log(
			`IconFolderYaml v.${this.manifest.version} loaded.`
		);
		await this.loadSettings();
		/** command that read the opened file and return the icon */
		this.addCommand({
			id: "set-file-icon",
			name: "Set file icon in frontmatter",
			// @ts-ignore
			checkCallback: async (checking) => {
				const file = this.app.workspace.getActiveFile();
				if (file) {
					if (!checking) {
						const icon = await this.getFileIcons(file);
						if (icon) {
							await this.editFrontmatter(file, icon);
						}
					}
					return true;
				}
				return false;
			},
		});
		
	}
	onunload() {
		console.log(
			`IconFolderYaml v.${this.manifest.version} unloaded.`
		);
	}
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}
	async saveSettings() {
		await this.saveData(this.settings);
	}
}
