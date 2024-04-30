/* eslint-disable @typescript-eslint/no-explicit-any */
import { normalizePath,Plugin, TFile, TFolder,  } from "obsidian";
import { App } from "obsidian-undocumented";
import dedent from "ts-dedent";

import { DEFAULT_SETTINGS, IconFile, IconizeAssistantSettings, Rule } from "./interface";
import { IconizeAssistantTab } from "./settings";

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

	searchIfApplicable(rules: Rule[], path: string): undefined | Rule {
		if (!this.settings.allowRegex) return undefined;
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
		const rules = data.settings.rules as Rule[];
		const iconFolder = data.settings.iconPacksPath as string;
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
				return iconPath.replace(`${iconFolder}/`, "");
			}
		} else if (this.searchIfApplicable(rules, path)) {
			const iconPath = this.searchIfApplicable(rules, path).icon;
			const packPrefix = allPackPrefix.find(pack => {
				return iconPath.startsWith(pack.prefix);
			});
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
		console.log(`Get icon as file: ${getIconAsFile}`);
		await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
			if (getIconAsFile && getIconAsFile instanceof TFile && this.settings.linkToFile.enable) {
				frontmatter[`${this.settings.linkToFile.name}`] = `[[${getIconAsFile.path}|${getIconAsFile.basename}]]`;
			}
			if (this.settings.iconName.enable)
				frontmatter[`${this.settings.iconName.name}`] = icon;
		});
	}

	async addCSS() {
		//open styles.css or create it
		const thisCssPath = normalizePath(`${this.app.vault.configDir}/plugins/${this.manifest.id}/styles.css`);
		let css: string = "";
		const oldCSS = await this.app.vault.adapter.read(thisCssPath);

		const cssRule = (keyName: string) => {
			return `/* Hide ${keyName} in properties */
			.metadata-property[data-property-key="${keyName}"] { 
				display: none !important;
			}
			`;
		};
		if (this.settings.iconName.enable && this.settings.iconName.hide) {
			css = cssRule(this.settings.iconName.name);
		}
		if (this.settings.linkToFile.enable && this.settings.linkToFile.hide) {
			css += cssRule(this.settings.linkToFile.name);
		}
		if (oldCSS === css) return;
		await this.app.vault.adapter.write(thisCssPath, dedent(css));
		//inject with document
		const style = document.querySelector(`style[plugin="${this.manifest.id}"]`);
		if (style) {
			document.head.removeChild(style);
		}
		if (css.length > 0) {
			const style = document.createElement("style");
			style.setAttribute("plugin", this.manifest.id);
			style.type = "text/css";
			style.textContent = dedent(css);
			document.head.appendChild(style);
		}
	}

	async onload() {
		console.log(
			`Iconize Assistant v.${this.manifest.version} loaded.`
		);
		await this.loadSettings();
		this.addSettingTab(new IconizeAssistantTab(this.app, this));
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
