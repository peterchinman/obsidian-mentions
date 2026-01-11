import {App, PluginSettingTab, Setting} from "obsidian";
import MyPlugin from "./main";

export interface MyPluginSettings {
	mentionsFolder: string;
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
	mentionsFolder: 'people'
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
	}
}
