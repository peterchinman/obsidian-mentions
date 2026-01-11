# Mentions Plugin for Obsidian

A simple and efficient plugin that lets you quickly create links to notes in a specific folder using the `@` symbol.

## Features

- Type `@` followed by a name to trigger autocomplete
- Automatically creates links in the format `[[folder/name|name]]`
- Configurable folder location for all mentions
- Shows suggestions from existing files in your mentions folder
- Allows creating new mentions on the fly
- **Support for multiple accepted names (aliases)** - define custom nicknames or alternate names for each person

## Usage

### Basic Usage

1. In any note, type `@` followed by a name (e.g., `@alice`)
2. A suggestion menu will appear showing:
   - Existing files in your mentions folder
   - The option to create a new mention
3. Select a suggestion with arrow keys and press Enter (or click)
4. The text will be replaced with a formatted wiki link: `[[people/alice|alice]]`

### Using Accepted Names (Aliases)

You can define multiple accepted names for each person by adding frontmatter to their file:

```yaml
---
accepted-names: [Alice, Ali, Allie]
---
```

Or using multi-line format:

```yaml
---
accepted-names:
  - Alice
  - Ali
  - Allie
---
```

Now you can type `@Ali` and the suggestion will show "Ali → Alice Cooper" and insert `[[people/Alice Cooper|Ali]]` - the link will display exactly what you typed!

## Configuration

Go to **Settings → Mentions** to configure:

- **Mentions folder**: The folder where your mention links should point to (default: `people`)
  - Example: If set to `people`, typing `@alice` will create `[[people/alice|alice]]`
  - Leave empty to create links without a folder prefix

- **Aliases field name**: The frontmatter property name for accepted names (default: `accepted-names`)
  - Allows you to customize which frontmatter field is used for aliases
  - You can change this to `aliases`, `nicknames`, or any other field name you prefer

## Installation

### Manual Installation

1. Copy `main.js`, `manifest.json`, and `styles.css` to your vault's plugin folder:
   ```
   <VaultFolder>/.obsidian/plugins/mentions-plugin/
   ```
2. Reload Obsidian
3. Enable the plugin in **Settings → Community plugins**

### Development

1. Clone this repo into your vault's plugins folder
2. Run `npm install` to install dependencies
3. Run `npm run dev` for development with hot reload
4. Run `npm run build` for production build

## Examples

### Basic Examples

With `mentionsFolder` set to `people`:
- Type `@john` → get `[[people/john|john]]`
- Type `@jane-doe` → get `[[people/jane-doe|jane-doe]]`

With `mentionsFolder` empty:
- Type `@alice` → get `[[alice|alice]]`

### Examples with Accepted Names

Given a file `people/Abigail Adams.md` with frontmatter:
```yaml
---
accepted-names: [Abigail, Abby, AA]
---
```

- Type `@Abby` → suggestion shows "Abby → Abigail Adams" → inserts `[[people/Abigail Adams|Abby]]`
- Type `@AA` → suggestion shows "AA → Abigail Adams" → inserts `[[people/Abigail Adams|AA]]`
- Type `@Abigail Adams` → suggestion shows "Abigail Adams" (basename) → inserts `[[people/Abigail Adams|Abigail Adams]]`

**Note:** When using accepted names in YAML, do not put quotes around the brackets:
- ✅ Correct: `accepted-names: [Alice, Ali]`
- ❌ Wrong: `accepted-names: "[Alice, Ali]"` (this creates a string, not an array)

## License

0-BSD
