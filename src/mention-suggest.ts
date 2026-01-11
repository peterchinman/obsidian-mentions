import {Editor, EditorPosition, EditorSuggest, EditorSuggestContext, EditorSuggestTriggerInfo, TFile} from "obsidian";
import MyPlugin from "./main";

interface MentionSuggestion {
	name: string;
	file?: TFile;
}

export class MentionSuggest extends EditorSuggest<MentionSuggestion> {
	plugin: MyPlugin;

	constructor(plugin: MyPlugin) {
		super(plugin.app);
		this.plugin = plugin;
	}

	onTrigger(cursor: EditorPosition, editor: Editor, file: TFile): EditorSuggestTriggerInfo | null {
		// Get the line up to the cursor
		const line = editor.getLine(cursor.line);
		const textBeforeCursor = line.substring(0, cursor.ch);

		// Check if the text ends with @ followed by optional characters
		const match = textBeforeCursor.match(/@([a-zA-Z0-9_-]*)$/);
		
		if (match) {
			return {
				start: {line: cursor.line, ch: cursor.ch - match[0].length},
				end: cursor,
				query: match[1] || ''
			};
		}

		return null;
	}

	getSuggestions(context: EditorSuggestContext): MentionSuggestion[] {
		const query = context.query.toLowerCase();
		const mentionsFolder = this.plugin.settings.mentionsFolder;
		
		// Get all files in the mentions folder
		const files = this.app.vault.getMarkdownFiles();
		const mentionFiles = files.filter(file => {
			const path = file.path;
			// Check if file is in the mentions folder
			if (mentionsFolder) {
				return path.startsWith(mentionsFolder + '/');
			}
			return false;
		});

		// Create suggestions from existing files in the mentions folder
		const suggestions: MentionSuggestion[] = mentionFiles.map(file => {
			const name = file.basename;
			return {name, file};
		}).filter(s => s.name.toLowerCase().includes(query));

		// If the user is typing something, also suggest creating that as a new mention
		if (query.length > 0) {
			const exactMatch = suggestions.find(s => s.name.toLowerCase() === query);
			if (!exactMatch) {
				suggestions.unshift({name: query});
			}
		}

		return suggestions;
	}

	renderSuggestion(suggestion: MentionSuggestion, el: HTMLElement): void {
		el.createEl("div", {text: suggestion.name});
		if (!suggestion.file) {
			el.createEl("small", {text: " (new)", cls: "mention-new"});
		}
	}

	selectSuggestion(suggestion: MentionSuggestion, evt: MouseEvent | KeyboardEvent): void {
		if (!this.context) return;

		const {editor} = this.context;
		const {start, end} = this.context;
		
		const mentionsFolder = this.plugin.settings.mentionsFolder;
		const path = mentionsFolder ? `${mentionsFolder}/${suggestion.name}` : suggestion.name;
		
		// Replace @name with [[folder/name|name]]
		const replacement = `[[${path}|${suggestion.name}]]`;
		
		editor.replaceRange(replacement, start, end);
		
		// Move cursor to after the inserted text
		const newCursor = {
			line: start.line,
			ch: start.ch + replacement.length
		};
		editor.setCursor(newCursor);
	}
}
