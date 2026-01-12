# Test Suite

This directory contains tests for the Mentions Plugin.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Coverage

### Alias Display Behavior

Tests that verify the plugin correctly displays accepted names (aliases) when searching for mentions:

1. **Alias Arrow Notation** - When searching for an alias (e.g., "Turly"), the suggestion should display as "Turly → John Turlington"
2. **Multiple Aliases** - Files can have multiple aliases (array format), and each should work correctly
3. **Shortest Matching Alias** - When multiple aliases match a query, the shortest one is displayed (most specific)
4. **Comma-Separated Aliases** - Aliases can be defined as comma-separated strings, not just arrays
5. **Basename Display** - When searching for the actual name (not an alias), no arrow notation is shown
6. **Alias Preference** - When both an alias and basename match, the alias is preferred

### Cache Updates

Tests that verify the caching system correctly updates when files change:

1. **Metadata Changes** - When a file's frontmatter changes (adding/removing aliases), the cache updates correctly

### Backlink Sorting

Tests that verify files are sorted by popularity (backlink count) while preserving alias information:

1. **Backlink Count Sorting** - Files with more backlinks appear first, but alias information is maintained

## Mock Structure

The `__mocks__/obsidian.ts` file provides mock implementations of the Obsidian API:

- `TFile` - Represents a file in the vault
- `App`, `Vault`, `MetadataCache` - Provides vault and metadata access
- `EditorSuggest` - Base class for suggestion UI
- `Plugin` - Base plugin class

## Test Data

Tests use mock files like:

```typescript
const johnFile = new TFile('people/John Turlington.md');
app.metadataCache.setFileCache(johnFile, {
  frontmatter: {
    'accepted-names': 'Turly'
  }
});
```

## Known Limitations

- Tests don't cover the actual Obsidian UI rendering (requires integration tests)
- Editor trigger behavior (`onTrigger`) is not fully tested
- File creation and vault events are mocked, not real

## Adding New Tests

When adding new functionality:

1. Add test cases to `mention-suggest.test.ts`
2. Use descriptive test names that explain the expected behavior
3. Set up appropriate mock data
4. Assert both the result and side effects
5. Run `npm test` to verify all tests still pass
