import {Editor, EditorPosition, EditorSuggest, EditorSuggestContext, EditorSuggestTriggerInfo, TFile} from "obsidian";
import MyPlugin from "./main";

interface MentionSuggestion {
	name: string;        // The file basename (e.g., "Abigail A")
	file?: TFile;
	alias?: string;      // The alias that was matched (e.g., "Arbis")
}

interface CachedMention {
	file: TFile;
	basename: string;
	aliases: string[];
	backlinkCount: number;
}

export class MentionSuggest extends EditorSuggest<MentionSuggestion> {
	plugin: MyPlugin;
	private mentionCache: Map<string, CachedMention> = new Map();
	private cacheReady: boolean = false;

	constructor(plugin: MyPlugin) {
		super(plugin.app);
		this.plugin = plugin;
		
		// Delay initial cache build to allow metadata cache to populate
		setTimeout(() => {
			this.buildCache();
		}, 1000);
		
		// Rebuild on file changes
		this.plugin.registerEvent(
			this.app.vault.on('create', (file) => {
				if (file instanceof TFile && this.isInMentionsFolder(file)) {
					this.buildCache();
				}
			})
		);
		
		this.plugin.registerEvent(
			this.app.vault.on('delete', (file) => {
				if (file instanceof TFile && this.isInMentionsFolder(file)) {
					this.buildCache();
				}
			})
		);
		
		this.plugin.registerEvent(
			this.app.vault.on('rename', (file) => {
				if (file instanceof TFile && this.isInMentionsFolder(file)) {
					this.buildCache();
				}
			})
		);
		
		// Update single mention when metadata changes (for alias updates)
		this.plugin.registerEvent(
			this.app.metadataCache.on('changed', (file) => {
				if (this.isInMentionsFolder(file)) {
					this.updateSingleMention(file);
				}
			})
		);
		
		// Update backlink counts when links change
		this.plugin.registerEvent(
			this.app.metadataCache.on('resolved', () => {
				this.updateBacklinkCounts();
			})
		);
	}

	buildCache(): void {
		this.mentionCache.clear();
		const mentionsFolder = this.plugin.settings.mentionsFolder;
		if (!mentionsFolder) return;

		// Get mention files once
		const files = this.app.vault.getMarkdownFiles();
		const mentionFiles = files.filter(f => f.path.startsWith(mentionsFolder + '/'));

		// Pre-compute backlinks once by inverting the data structure
		const allLinks = this.app.metadataCache.resolvedLinks;
		const backlinkCounts = new Map<string, number>();

		// Build inverted index: target → count of sources
		for (const sourcePath in allLinks) {
			const targets = allLinks[sourcePath];
			for (const targetPath in targets) {
				backlinkCounts.set(targetPath, (backlinkCounts.get(targetPath) || 0) + 1);
			}
		}
		
		for (const file of mentionFiles) {
			const backlinkCount = backlinkCounts.get(file.path) || 0;

			// Parse aliases
			const cache = this.app.metadataCache.getFileCache(file);
			const aliasesField = this.plugin.settings.aliasesField;
			const aliasesValue = cache?.frontmatter?.[aliasesField];
			
			let aliases: string[] = [];
			if (Array.isArray(aliasesValue)) {
				aliases = aliasesValue;
			} else if (typeof aliasesValue === 'string') {
				aliases = aliasesValue.split(',').map(a => a.trim()).filter(a => a);
			}

			this.mentionCache.set(file.path, {
				file,
				basename: file.basename,
				aliases,
				backlinkCount
			});
		}
		
		this.cacheReady = true;
	}

	private updateBacklinkCounts(): void {
		if (!this.cacheReady) return;

		// Build inverted index for all backlinks
		const allLinks = this.app.metadataCache.resolvedLinks;
		const backlinkCounts = new Map<string, number>();
		
		for (const sourcePath in allLinks) {
			const targets = allLinks[sourcePath];
			for (const targetPath in targets) {
				backlinkCounts.set(targetPath, (backlinkCounts.get(targetPath) || 0) + 1);
			}
		}
		
		// Update backlink counts in existing cache entries
		for (const [path, cached] of this.mentionCache) {
			cached.backlinkCount = backlinkCounts.get(path) || 0;
		}
	}

	private updateSingleMention(file: TFile): void {
		const cached = this.mentionCache.get(file.path);
		if (!cached) return; // File not in cache (not a mention file)
		
		// Re-parse aliases for this file
		const cache = this.app.metadataCache.getFileCache(file);
		const aliasesField = this.plugin.settings.aliasesField;
		const aliasesValue = cache?.frontmatter?.[aliasesField];
		
		let aliases: string[] = [];
		if (Array.isArray(aliasesValue)) {
			aliases = aliasesValue;
		} else if (typeof aliasesValue === 'string') {
			aliases = aliasesValue.split(',').map(a => a.trim()).filter(a => a);
		}
		
		cached.aliases = aliases;
		cached.basename = file.basename; // Handle renames
	}

	private isInMentionsFolder(file: TFile): boolean {
		const folder = this.plugin.settings.mentionsFolder;
		return folder ? file.path.startsWith(folder + '/') : false;
	}

	onTrigger(cursor: EditorPosition, editor: Editor, file: TFile): EditorSuggestTriggerInfo | null {
		// Get the line up to the cursor
		const line = editor.getLine(cursor.line);
		const textBeforeCursor = line.substring(0, cursor.ch);

		// Check if the text ends with @ followed by optional characters (max one space allowed)
		// Matches: @, @John, @John Smith, but not @John Smith Jr (two spaces)
		const match = textBeforeCursor.match(/@([a-zA-Z0-9_-]*(?:\s[a-zA-Z0-9_-]+)?)$/);
		
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
		if (!this.cacheReady) return [];
		
		const query = context.query.toLowerCase();
		const suggestions: MentionSuggestion[] = [];
		
		// Filter cached mentions by query
		for (const cached of this.mentionCache.values()) {
			// Check aliases first
			const matchingAliases = cached.aliases.filter(alias => 
				alias.toLowerCase().includes(query)
			);
			
			if (matchingAliases.length > 0) {
				const bestAlias = matchingAliases.sort((a, b) => a.length - b.length)[0];
				suggestions.push({name: cached.basename, file: cached.file, alias: bestAlias});
			} else if (cached.basename.toLowerCase().includes(query)) {
				suggestions.push({name: cached.basename, file: cached.file});
			}
		}
		
		// Sort by pre-computed backlink count
		suggestions.sort((a, b) => {
			if (!a.file && b.file) return 1;
			if (a.file && !b.file) return -1;
			if (!a.file && !b.file) return 0;
			
			const aCached = this.mentionCache.get(a.file!.path);
			const bCached = this.mentionCache.get(b.file!.path);
			return (bCached?.backlinkCount || 0) - (aCached?.backlinkCount || 0);
		});
		
		// Add "create new" suggestion at the end
		if (query.length > 0) {
			const exactMatch = suggestions.find(s => 
				(s.alias && s.alias.toLowerCase() === query) || 
				(!s.alias && s.name.toLowerCase() === query)
			);
			if (!exactMatch) {
				suggestions.push({name: context.query});
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
