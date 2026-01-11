import {App, PluginSettingTab, Setting} from "obsidian";
import MyPlugin from "./main";

export interface MyPluginSettings {
	mentionsFolder: string;
	aliasesField: string;
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
	mentionsFolder: 'people',
	aliasesField: 'accepted-names'
}

export class MentionsSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Mentions plugin settings'});

		new Setting(containerEl)
			.setName('Mentions folder')
			.setDesc('The folder where your mentions should link to (e.g., "people" will create links like [[people/name|name]])')
			.addText(text => text
				.setPlaceholder('people')
				.setValue(this.plugin.settings.mentionsFolder)
				.onChange(async (value) => {
					this.plugin.settings.mentionsFolder = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Aliases field name')
			.setDesc('The frontmatter field name for accepted names/aliases (e.g., "accepted-names" allows you to define multiple names for each person)')
			.addText(text => text
				.setPlaceholder('accepted-names')
				.setValue(this.plugin.settings.aliasesField)
				.onChange(async (value) => {
					this.plugin.settings.aliasesField = value;
					await this.plugin.saveSettings();
				}));
	}
}
