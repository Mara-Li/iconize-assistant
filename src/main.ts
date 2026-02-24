import dedent from "dedent";
import i18next from "i18next";
import { normalizePath, Plugin, setIcon, TFile, TFolder } from "obsidian";
import { resources, translationLanguage } from "./i18n";
import { Iconic } from "./iconic";
import { Iconize } from "./iconize";
import { DEFAULT_SETTINGS, IconizeAssistantSettings } from "./interface";
import { IconizeAssistantTab } from "./settings";

export default class IconizeAssistant extends Plugin {
	settings!: IconizeAssistantSettings;

	createIconPackPrefix(iconPackName: string): string {
		if (iconPackName.includes("-")) {
			const splitted = iconPackName.split("-");
			let result = splitted[0].charAt(0).toUpperCase();
			for (let i = 1; i < splitted.length; i++) {
				result += splitted[i].charAt(0).toLowerCase();
			}
			return result;
		}
		return (
			iconPackName.charAt(0).toUpperCase() +
			iconPackName.charAt(1).toLowerCase()
		);
	}

	/**
	 * Three type of folder note:
	 * 1. Inside: Same name of parent folder => "x/folder/folder.md"
	 * 2. Outside: Same name of a folder in the same level => "x/folder.md" == "x/folder"
	 * 3. Named index: "x/folder/index.md"
	 * @param file
	 */
	findFolderNote(file: TFile): TFolder | undefined {
		if (file.basename === "index" || file.basename === file?.parent?.name) {
			return file.parent ?? undefined;
		}
		const regexExt = new RegExp(`\\.${file.extension}$`);
		const outsideFolderPath = file.path.replace(regexExt, "");
		const folder = this.app.vault.getAbstractFileByPath(outsideFolderPath);
		if (folder instanceof TFolder) {
			return folder;
		}
		return undefined;
	}

	getIcon(file: TFile) {
		if (this.settings.useIconic) {
			const iconic = new Iconic(this.app, this);
			return iconic.getFileIcon(file);
		} else {
			const iconize = new Iconize(this.app, this);
			return iconize.getFileIcon(file);
		}
	}

	async createFileForLucide(icon: string) {
		if (this.settings.createLucideFile) {
			const container = new DocumentFragment().createSpan();
			setIcon(container, icon.replaceAll("lucide-", "").trim());
			const svg = container.querySelector("svg");
			if (!svg) throw new Error(i18next.t("error.svgNotFound"));
			if (!svg.getAttribute("xmlns"))
				svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
			const svgText = svg.outerHTML;
			const lucideFolder = normalizePath(
				`${this.settings.iconFolderPath}/${this.settings.lucidePrefix}`,
			);
			const newFilePath = normalizePath(
				this.settings.iconFolderPath +
					`/${this.settings.lucidePrefix}/` +
					icon.replaceAll("lucide-", "") +
					".svg",
			);
			const existing =
				this.app.vault.getAbstractFileByPathInsensitive(newFilePath);
			if (existing instanceof TFile) return newFilePath;
			else {
				//create folder if not existe
				if (!(await this.app.vault.exists(lucideFolder, true)))
					await this.app.vault.createFolder(lucideFolder);

				await this.app.vault.create(newFilePath, svgText);
			}
			return newFilePath;
		}
	}

	async getFileIcons(file: TFile) {
		//get icons folder from another obsidian plugin
		if (!(await this.app.vault.exists(this.settings.iconFolderPath))) {
			//create the folder if not exist
			if (this.settings.iconFolderPath.startsWith(".obsidian")) {
				await this.app.vault.adapter.mkdir(this.settings.iconFolderPath);
			} else await this.app.vault.createFolder(this.settings.iconFolderPath);
			return null;
		}
		const fileIcon = await this.getIcon(file);

		if (fileIcon && fileIcon.startsWith("lucide-")) {
			const path = await this.createFileForLucide(fileIcon);
			if (path)
				return path
					.replace(`${this.settings.iconFolderPath}/`, "")
					.replace(".svg", "");
		}
		try {
			const iconPack = (
				await this.app.vault.adapter.list(this.settings.iconFolderPath)
			).folders;
			const allPackPrefix = iconPack.map((pack) => {
				return {
					pack,
					prefix: this.createIconPackPrefix(pack.split("/").pop() as string),
				};
			});
			if (fileIcon) {
				const packPrefix = allPackPrefix.find((pack) => {
					return fileIcon.startsWith(pack.prefix);
				});
				if (packPrefix) {
					const iconPath = `${packPrefix.pack}/${fileIcon.replace(packPrefix.prefix, "")}`;
					//remove obsidian folder from path
					return iconPath.replace(`${this.settings.iconFolderPath}/`, "");
				}
			}
			return null;
		} catch (e) {
			console.error("Error getting file icons: ", e);
			return null;
		}
	}

	async editFrontmatter(file: TFile, icon: string) {
		const getIconAsFile = this.app.vault.getAbstractFileByPathInsensitive(
			normalizePath(`${this.settings.iconFolderPath}/${icon}.svg`),
		);
		await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
			if (
				getIconAsFile &&
				getIconAsFile instanceof TFile &&
				this.settings.linkToFile.enable
			) {
				frontmatter[`${this.settings.linkToFile.name}`] =
					`[[${getIconAsFile.path}|${getIconAsFile.basename}]]`;
			}
			if (this.settings.iconName.enable)
				frontmatter[`${this.settings.iconName.name}`] = icon;
		});
	}

	async addCSS() {
		//open styles.css or create it
		const thisCssPath = normalizePath(
			`${this.app.vault.configDir}/plugins/${this.manifest.id}/styles.css`,
		);
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
		console.log(`Iconize Assistant v.${this.manifest.version} loaded.`);
		await i18next.init({
			lng: translationLanguage,
			fallbackLng: "en",
			resources,
			returnNull: false,
			returnEmptyString: false,
			showSupportNotice: false,
		});
		await this.loadSettings();
		this.addSettingTab(new IconizeAssistantTab(this.app, this));
		/** command that read the opened file and return the icon */
		this.addCommand({
			id: "set-file-icon",
			name: i18next.t("commands"),
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

		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu, _editor, info) => {
				if (!this.settings.addEditorMenu) return;
				const file = info.file;
				if (!file) return;
				menu.addItem((item) =>
					item
						.setTitle(i18next.t("commands"))
						.setIcon("file-type")
						.onClick(async () => {
							const icon = await this.getFileIcons(file);
							if (!icon) return;
							await this.editFrontmatter(file, icon);
						}),
				);
			}),
		);

		this.registerEvent(
			this.app.workspace.on("file-menu", async (menu, file) => {
				if (!this.settings.addFileMenu) return;
				if (!(file instanceof TFile)) return;
				menu.addItem((item) =>
					item
						.setTitle(i18next.t("commands"))
						.setIcon("file-type")
						.onClick(async () => {
							const icon = await this.getFileIcons(file);
							if (!icon) return;
							await this.editFrontmatter(file, icon);
						}),
				);
			}),
		);
	}
	onunload() {
		console.log(`Iconize assistant v.${this.manifest.version} unloaded.`);
	}
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}
	async saveSettings() {
		await this.saveData(this.settings);
	}
}
