import { Plugin, TFile, TFolder, normalizePath, } from "obsidian";
import { DEFAULT_SETTINGS, IconFile, IconizeAssistantSettings } from "./interface";
import { App } from "obsidian-undocumented";

export default class IconizeAssistant extends Plugin {
	settings: IconizeAssistantSettings;

	createIconPackPrefix(iconPackName: string): string {
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

	searchIfApplicable(rules: any, path: string) {
		return rules.find((rule: any) => {
			const regex = new RegExp(rule.rule);
			return ((rule.for === "everything" || rule.for === "files")) && regex.test(path);
		});
	}

	/**
	 * Three type of folder note:
	 * 1. Inside: Same name of parent folder => "x/folder/folder.md"
	 * 2. Outside: Same name of a folder in the same level => "x/folder.md" == "x/folder"
	 * 3. Named index: "x/folder/index.md"
	 * @param file 
	 */
	findFolderNote(file: TFile): TFolder | undefined {
		if (file.basename === "index" || file.basename === file.parent.name) {
			return file.parent;
		}
		const regexExt = new RegExp(`\\.${file.extension}$`);
		const outsideFolderPath = file.path.replace(regexExt, "");
		const folder = this.app.vault.getAbstractFileByPath(outsideFolderPath);
		if (folder instanceof TFolder) {
			return folder;
		}
		return undefined;
	}

	async getFileIcons(file: TFile) {
		//get icons folder from another obsidian plugin
		const obsidianIconFolder = (this.app as App).plugins.getPlugin("obsidian-icon-folder");
		const data = await obsidianIconFolder.loadData();
		const rules = data.settings.rules;
		const iconFolder = data.settings.iconPacksPath;
		this.settings.iconFolderPath = iconFolder;
		await this.saveSettings();
		//remove "settings" from data
		delete data.settings;
		const icon = data as IconFile;
		/**
		 * Add the key "type" to the object
		 * based of the file extension
		 * If no extension = "folder"
		 * else "file"
		 */
		const path = file.path;
		const isFolder = this.findFolderNote(file)?.path;
		const fileIcon: string = icon[path] ? icon[path as string].toString() : icon[isFolder] ? icon[isFolder].toString() : null;

		const iconPack = (await this.app.vault.adapter.list(iconFolder)).folders;
		const allPackPrefix = iconPack.map(pack => {
			return {
				pack,
				prefix: this.createIconPackPrefix(pack.split("/").pop() as string)
			};
		});
		if (fileIcon) {
			const packPrefix = allPackPrefix.find(pack => {
				return fileIcon.startsWith(pack.prefix);
			});
			if (packPrefix) {
				const iconPath = `${packPrefix.pack}/${fileIcon.replace(packPrefix.prefix, "")}`;
				//remove obsidian folder from path
				return iconPath.replace(iconFolder + "/", "");
			}
		} else if (this.searchIfApplicable(rules, path)) {
			const iconPath = this.searchIfApplicable(rules, path).icon;
			const packPrefix = allPackPrefix.find(pack => {
				return iconPath.startsWith(pack.prefix);
			});
			console.log(packPrefix, iconPack);
			if (packPrefix) {
				const folderIconPath = `${packPrefix.pack}/${iconPath.replace(packPrefix.prefix, "")}`;
				//remove obsidian folder from path
				return folderIconPath.replace(`${iconFolder}/`, "");
			}
		}
		return null;
	}

	async editFrontmatter(file: TFile, icon: string) {
		const getIconAsFile = this.app.vault.getAbstractFileByPath(normalizePath(`${this.settings.iconFolderPath}/${icon}.svg`));

		await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
			if (getIconAsFile && getIconAsFile instanceof TFile) {
				frontmatter.icon_file = `[[${getIconAsFile.path}|${getIconAsFile.basename}]]`;
			}
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
