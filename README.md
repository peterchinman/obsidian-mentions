# Mentions Plugin for Obsidian

A simple and efficient plugin that lets you quickly create links to notes in a specific folder using the `@` symbol.

## Features

- Type `@` followed by a name to trigger autocomplete
- Automatically creates links in the format `[[folder/name|name]]`
- Configurable folder location for all mentions
- Shows suggestions from existing files in your mentions folder
- Allows creating new mentions on the fly

## Usage

1. In any note, type `@` followed by a name (e.g., `@alice`)
2. A suggestion menu will appear showing:
   - Existing files in your mentions folder
   - The option to create a new mention
3. Select a suggestion with arrow keys and press Enter (or click)
4. The text will be replaced with a formatted wiki link: `[[people/alice|alice]]`

## Configuration

Go to **Settings → Mentions** to configure:

- **Mentions folder**: The folder where your mention links should point to (default: `people`)
  - Example: If set to `people`, typing `@alice` will create `[[people/alice|alice]]`
  - Leave empty to create links without a folder prefix

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

With `mentionsFolder` set to `people`:
- Type `@john` → get `[[people/john|john]]`
- Type `@jane-doe` → get `[[people/jane-doe|jane-doe]]`

With `mentionsFolder` empty:
- Type `@alice` → get `[[alice|alice]]`

## License

0-BSD
