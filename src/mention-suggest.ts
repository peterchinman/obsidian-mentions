import {Editor, EditorPosition, EditorSuggest, EditorSuggestContext, EditorSuggestTriggerInfo, TFile} from "obsidian";
import MyPlugin from "./main";

interface MentionSuggestion {
	name: string;        // The file basename (e.g., "Abigail A")
	file?: TFile;
	alias?: string;      // The alias that was matched (e.g., "Arbis")
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
		const suggestions: MentionSuggestion[] = [];
		for (const file of mentionFiles) {
			const basename = file.basename;
			const cache = this.app.metadataCache.getFileCache(file);
			const aliasesField = this.plugin.settings.aliasesField;
			const aliasesValue = cache?.frontmatter?.[aliasesField];
			
			// Parse aliases (can be array or comma-separated string)
			let aliases: string[] = [];
			if (Array.isArray(aliasesValue)) {
				aliases = aliasesValue;
			} else if (typeof aliasesValue === 'string') {
				aliases = aliasesValue.split(',').map(a => a.trim()).filter(a => a);
			}
			
			// Filter aliases that match the query
			const matchingAliases = aliases.filter(alias => 
				alias.toLowerCase().includes(query)
			);
			
			// If any aliases match, pick the best one (shortest match = most specific)
			if (matchingAliases.length > 0) {
				const bestAlias = matchingAliases.sort((a, b) => a.length - b.length)[0];
				suggestions.push({name: basename, file, alias: bestAlias});
			} else if (basename.toLowerCase().includes(query)) {
				// Only show basename if no aliases match and basename matches
				suggestions.push({name: basename, file});
			}
		}

		// If the user is typing something, also suggest creating that as a new mention
		if (query.length > 0) {
			const exactMatch = suggestions.find(s => 
				(s.alias && s.alias.toLowerCase() === query) || 
				(!s.alias && s.name.toLowerCase() === query)
			);
			if (!exactMatch) {
				suggestions.unshift({name: query});
			}
		}

		return suggestions;
	}

	renderSuggestion(suggestion: MentionSuggestion, el: HTMLElement): void {
		if (suggestion.alias) {
			// Show "Arbis → Abigail A"
			el.createEl("div", {text: `${suggestion.alias} → ${suggestion.name}`});
		} else {
			// Show just the basename
			el.createEl("div", {text: suggestion.name});
		}
		
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
		
		// Use alias as display text if available, otherwise use basename
		const displayText = suggestion.alias || suggestion.name;
		
		// Replace @name with [[folder/name|displayText]]
		const replacement = `[[${path}|${displayText}]]`;
		
		editor.replaceRange(replacement, start, end);
		
		// Move cursor to after the inserted text
		const newCursor = {
			line: start.line,
			ch: start.ch + replacement.length
		};
		editor.setCursor(newCursor);
	}
}
