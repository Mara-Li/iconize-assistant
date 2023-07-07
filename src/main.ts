import { Plugin } from "obsidian";
import { IconFolderYamlSettingsTab } from "./settings";
import { IconFolderYamlSettings, DEFAULT_SETTINGS } from "./interface";
import { IconFolderYamlModals } from "./modals";
import i18next from "i18next";
import { resources, translationLanguage } from "./i18n/i18next";
export default class IconFolderYaml extends Plugin {
	settings: IconFolderYamlSettings;
	async onload() {
		console.log(
			`IconFolderYaml v.${this.manifest.version} (lang: ${translationLanguage}) loaded.`
		);
		i18next.init({
			lng: translationLanguage,
			fallbackLng: "en",
			resources: resources,
			returnNull: false,
		});
		await this.loadSettings();
		this.addSettingTab(new IconFolderYamlSettingsTab(this.app, this));
		this.addCommand({
			id: "open-IconFolderYaml-modal",
			name: "Open IconFolderYaml Modal",
			callback: () => {
				new IconFolderYamlModals(this.app, this).open();
			},
		});
	}
	onunload() {
		console.log(
			`IconFolderYaml v.${this.manifest.version} (lang: ${translationLanguage}) unloaded.`
		);
	}
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}
	async saveSettings() {
		await this.saveData(this.settings);
	}
}
