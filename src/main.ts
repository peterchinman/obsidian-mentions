import {Plugin} from 'obsidian';
import {DEFAULT_SETTINGS, MyPluginSettings, MentionsSettingTab} from "./settings";
import {MentionSuggest} from "./mention-suggest";

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	mentionSuggest: MentionSuggest;

	async onload() {
		await this.loadSettings();

		// Register the mention suggester
		this.mentionSuggest = new MentionSuggest(this);
		this.registerEditorSuggest(this.mentionSuggest);

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
		// Rebuild cache when mentions folder or aliases field changes
		this.mentionSuggest?.buildCache();
	}
}
