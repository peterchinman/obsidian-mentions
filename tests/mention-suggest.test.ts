import { MentionSuggest } from '../src/mention-suggest';
import { App, TFile, EditorSuggestContext, EditorPosition } from 'obsidian';
import MyPlugin from '../src/main';

describe('MentionSuggest', () => {
	let app: App;
	let plugin: MyPlugin;
	let mentionSuggest: MentionSuggest;

	beforeEach(() => {
		app = new App();
		plugin = {
			app,
			settings: {
				mentionsFolder: 'people',
				aliasesField: 'accepted-names'
			},
			registerEvent: jest.fn()
		} as any;

		mentionSuggest = new MentionSuggest(plugin);
	});

	describe('Alias Display Behavior', () => {
		it('should display alias arrow notation when alias matches query', () => {
			// Setup: Create a person file with an alias
			const johnFile = new TFile('people/John Turlington.md');
			app.vault.setFiles([johnFile]);

			// Set metadata with accepted-names alias
			app.metadataCache.setFileCache(johnFile, {
				frontmatter: {
					'accepted-names': 'Turly'
				}
			});

			// Build the cache
			mentionSuggest.buildCache();

			// Create a mock context for searching "Turly"
			const context: EditorSuggestContext = {
				query: 'Turly',
				editor: null as any,
				file: null as any,
				start: { line: 0, ch: 0 },
				end: { line: 0, ch: 6 }
			};

			// Get suggestions
			const suggestions = mentionSuggest.getSuggestions(context);

			// Should find John Turlington with the "Turly" alias
			expect(suggestions.length).toBeGreaterThan(0);
			const suggestion = suggestions.find(s => s.name === 'John Turlington');
			expect(suggestion).toBeDefined();
			expect(suggestion?.alias).toBe('Turly');
		});

		it('should display multiple aliases correctly', () => {
			const johnFile = new TFile('people/John Turlington.md');
			app.vault.setFiles([johnFile]);

			// Set metadata with multiple aliases (array format)
			app.metadataCache.setFileCache(johnFile, {
				frontmatter: {
					'accepted-names': ['Turly', 'JT', 'John T']
				}
			});

			mentionSuggest.buildCache();

			// Test each alias
			const aliases = ['Turly', 'JT', 'John T'];
			for (const alias of aliases) {
				const context: EditorSuggestContext = {
					query: alias,
					editor: null as any,
					file: null as any,
					start: { line: 0, ch: 0 },
					end: { line: 0, ch: alias.length }
				};

				const suggestions = mentionSuggest.getSuggestions(context);
				const suggestion = suggestions.find(s => s.name === 'John Turlington');
				
				expect(suggestion).toBeDefined();
				expect(suggestion?.alias).toBe(alias);
			}
		});

		it('should display shortest matching alias when multiple aliases match', () => {
			const johnFile = new TFile('people/John Turlington.md');
			app.vault.setFiles([johnFile]);

			app.metadataCache.setFileCache(johnFile, {
				frontmatter: {
					'accepted-names': ['Turly', 'Turlington', 'Tur']
				}
			});

			mentionSuggest.buildCache();

			// Search for "Tur" - should match all three but pick shortest
			const context: EditorSuggestContext = {
				query: 'Tur',
				editor: null as any,
				file: null as any,
				start: { line: 0, ch: 0 },
				end: { line: 0, ch: 3 }
			};

			const suggestions = mentionSuggest.getSuggestions(context);
			const suggestion = suggestions.find(s => s.name === 'John Turlington');
			
			expect(suggestion).toBeDefined();
			// Should pick "Tur" as it's the shortest
			expect(suggestion?.alias).toBe('Tur');
		});

		it('should handle comma-separated aliases string', () => {
			const johnFile = new TFile('people/John Turlington.md');
			app.vault.setFiles([johnFile]);

			// Set metadata with comma-separated string
			app.metadataCache.setFileCache(johnFile, {
				frontmatter: {
					'accepted-names': 'Turly, JT, John T'
				}
			});

			mentionSuggest.buildCache();

			const context: EditorSuggestContext = {
				query: 'JT',
				editor: null as any,
				file: null as any,
				start: { line: 0, ch: 0 },
				end: { line: 0, ch: 2 }
			};

			const suggestions = mentionSuggest.getSuggestions(context);
			const suggestion = suggestions.find(s => s.name === 'John Turlington');
			
			expect(suggestion).toBeDefined();
			expect(suggestion?.alias).toBe('JT');
		});

		it('should display basename when basename matches but no alias matches', () => {
			const johnFile = new TFile('people/John Turlington.md');
			app.vault.setFiles([johnFile]);

			app.metadataCache.setFileCache(johnFile, {
				frontmatter: {
					'accepted-names': ['Turly', 'JT']
				}
			});

			mentionSuggest.buildCache();

			// Search for "John" - matches basename, not aliases
			const context: EditorSuggestContext = {
				query: 'John',
				editor: null as any,
				file: null as any,
				start: { line: 0, ch: 0 },
				end: { line: 0, ch: 4 }
			};

			const suggestions = mentionSuggest.getSuggestions(context);
			const suggestion = suggestions.find(s => s.name === 'John Turlington');
			
			expect(suggestion).toBeDefined();
			// Should NOT have an alias when basename matches
			expect(suggestion?.alias).toBeUndefined();
		});

		it('should prefer alias over basename when both match', () => {
			const johnFile = new TFile('people/John Turlington.md');
			app.vault.setFiles([johnFile]);

			app.metadataCache.setFileCache(johnFile, {
				frontmatter: {
					'accepted-names': ['John', 'Turly']
				}
			});

			mentionSuggest.buildCache();

			// Search for "John" - matches both basename and alias
			const context: EditorSuggestContext = {
				query: 'John',
				editor: null as any,
				file: null as any,
				start: { line: 0, ch: 0 },
				end: { line: 0, ch: 4 }
			};

			const suggestions = mentionSuggest.getSuggestions(context);
			const suggestion = suggestions.find(s => s.name === 'John Turlington');
			
			expect(suggestion).toBeDefined();
			// Should have alias "John" even though basename also matches
			expect(suggestion?.alias).toBe('John');
		});
	});

	describe('Cache Updates', () => {
		it('should update aliases when single mention metadata changes', () => {
			const johnFile = new TFile('people/John Turlington.md');
			app.vault.setFiles([johnFile]);

			// Initial cache with one alias
			app.metadataCache.setFileCache(johnFile, {
				frontmatter: {
					'accepted-names': 'Turly'
				}
			});
			mentionSuggest.buildCache();

			// Update metadata with new alias
			app.metadataCache.setFileCache(johnFile, {
				frontmatter: {
					'accepted-names': ['Turly', 'JT']
				}
			});
			mentionSuggest['updateSingleMention'](johnFile);

			// Test new alias works
			const context: EditorSuggestContext = {
				query: 'JT',
				editor: null as any,
				file: null as any,
				start: { line: 0, ch: 0 },
				end: { line: 0, ch: 2 }
			};

			const suggestions = mentionSuggest.getSuggestions(context);
			const suggestion = suggestions.find(s => s.name === 'John Turlington');
			
			expect(suggestion).toBeDefined();
			expect(suggestion?.alias).toBe('JT');
		});
	});

	describe('Backlink Sorting with Aliases', () => {
		it('should sort by backlink count while preserving alias information', () => {
			const john = new TFile('people/John Turlington.md');
			const jane = new TFile('people/Jane Doe.md');
			app.vault.setFiles([john, jane]);

			app.metadataCache.setFileCache(john, {
				frontmatter: { 'accepted-names': 'Turly' }
			});
			app.metadataCache.setFileCache(jane, {
				frontmatter: { 'accepted-names': 'JD' }
			});

			// Jane has more backlinks
			app.metadataCache.resolvedLinks = {
				'file1.md': { 'people/Jane Doe.md': 1 },
				'file2.md': { 'people/Jane Doe.md': 1 },
				'file3.md': { 'people/John Turlington.md': 1 }
			};

			mentionSuggest.buildCache();

			const context: EditorSuggestContext = {
				query: '', // Empty query to get all
				editor: null as any,
				file: null as any,
				start: { line: 0, ch: 0 },
				end: { line: 0, ch: 0 }
			};

			const suggestions = mentionSuggest.getSuggestions(context);
			
			// Jane should come first (2 backlinks vs 1)
			expect(suggestions[0].name).toBe('Jane Doe');
			expect(suggestions[1].name).toBe('John Turlington');
			
			// But aliases should still be preserved
			// (though not shown since query is empty)
		});
	});
});
