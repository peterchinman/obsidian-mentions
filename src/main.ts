import {Plugin} from 'obsidian';
import {DEFAULT_SETTINGS, MyPluginSettings, MentionsSettingTab} from "./settings";
import {MentionSuggest} from "./mention-suggest";

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// Register the mention suggester
		this.registerEditorSuggest(new MentionSuggest(this));

		// Add settings tab
		this.addSettingTab(new MentionsSettingTab(this.app, this));
	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<MyPluginSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
