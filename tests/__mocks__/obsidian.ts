// Mock Obsidian API for testing

export class TFile {
	path: string;
	basename: string;
	extension: string;

	constructor(path: string) {
		this.path = path;
		const parts = path.split('/');
		const filename = parts[parts.length - 1];
		const nameParts = filename.split('.');
		this.extension = nameParts.pop() || '';
		this.basename = nameParts.join('.');
	}
}

export class EditorSuggest<T> {
	app: any;
	context: any;

	constructor(app: any) {
		this.app = app;
	}

	onTrigger(cursor: EditorPosition, editor: Editor, file: TFile): EditorSuggestTriggerInfo | null {
		return null;
	}

	getSuggestions(context: EditorSuggestContext): T[] {
		return [];
	}

	renderSuggestion(value: T, el: HTMLElement): void {}

	selectSuggestion(value: T, evt: MouseEvent | KeyboardEvent): void {}
}

export interface EditorPosition {
	line: number;
	ch: number;
}

export interface EditorSuggestTriggerInfo {
	start: EditorPosition;
	end: EditorPosition;
	query: string;
}

export interface EditorSuggestContext {
	query: string;
	editor: Editor;
	file: TFile;
	start: EditorPosition;
	end: EditorPosition;
}

export class Editor {
	getLine(line: number): string {
		return '';
	}

	replaceRange(replacement: string, from: EditorPosition, to?: EditorPosition): void {}

	setCursor(pos: EditorPosition): void {}
}

export class Plugin {
	app: any;
	manifest: any;

	constructor() {}

	async loadData(): Promise<any> {
		return {};
	}

	async saveData(data: any): Promise<void> {}

	registerEvent(eventRef: any): void {}

	registerEditorSuggest(suggester: any): void {}

	addSettingTab(tab: any): void {}

	async onload(): Promise<void> {}

	onunload(): void {}
}

export class App {
	vault: Vault;
	metadataCache: MetadataCache;

	constructor() {
		this.vault = new Vault();
		this.metadataCache = new MetadataCache();
	}
}

export class Vault {
	private files: TFile[] = [];

	getMarkdownFiles(): TFile[] {
		return this.files.filter(f => f.extension === 'md');
	}

	on(event: string, callback: Function): any {
		return { event, callback };
	}

	setFiles(files: TFile[]): void {
		this.files = files;
	}
}

export interface CachedMetadata {
	frontmatter?: Record<string, any>;
}

export class MetadataCache {
	private cache: Map<string, CachedMetadata> = new Map();
	resolvedLinks: Record<string, Record<string, number>> = {};

	getFileCache(file: TFile): CachedMetadata | null {
		return this.cache.get(file.path) || null;
	}

	setFileCache(file: TFile, metadata: CachedMetadata): void {
		this.cache.set(file.path, metadata);
	}

	on(event: string, callback: Function): any {
		return { event, callback };
	}
}

export class PluginSettingTab {
	app: App;
	plugin: Plugin;

	constructor(app: App, plugin: Plugin) {
		this.app = app;
		this.plugin = plugin;
	}

	display(): void {}
}

export class Setting {
	constructor(containerEl: HTMLElement) {}

	setName(name: string): this {
		return this;
	}

	setDesc(desc: string): this {
		return this;
	}

	addText(cb: (text: any) => any): this {
		return this;
	}
}
