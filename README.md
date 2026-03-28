# YouTube Timestamp Maker

A userscript that lets you create, manage, and export timestamps with notes directly on YouTube videos.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-YouTube-red)

## Features

- **Quick Timestamp Recording** — Press a keyboard shortcut to capture the current video time with one click
- **Section Dividers** — Add labeled section dividers to organize your timeline
- **Notes & Comments** — Add notes to each timestamp for context
- **Drag & Drop Reorder** — Easily rearrange timestamps by dragging
- **Import/Export** — Paste existing timestamps or copy all to clipboard
- **Bilingual Support** — Available in Traditional Chinese (zh-TW) and English
- **Customizable Shortcuts** — Set your own keyboard shortcuts for recording

## Installation

### Option 1: Install from Source (Recommended for Development)

1. Install a userscript manager:
   - [Tampermonkey](https://www.tampermonkey.net/) (Chrome, Edge, Firefox, Opera)
   - [Violentmonkey](https://violentmonkey.github.io/) (Chrome, Firefox, Edge)

2. Install [Bun](https://bun.sh) (or use npm/pnpm):

```bash
# Clone the repository
git clone https://github.com/yourusername/yt-timestamp-maker.git
cd yt-timestamp-maker

# Install dependencies
bun install

# Build the userscript
bun run build
```

3. Open Tampermonkey dashboard → "Create a new script" → paste contents from `_yt-timestamp-maker.user.js`

### Option 2: Development Mode

```bash
# Start Vite dev server
bun run dev
```

Then inject the script manually or use the Tampermonkey "Inject" feature for testing.

## Usage

### Recording Timestamps

1. Watch a YouTube video
2. Press the shortcut key (default: `Alt+Z`) to add a timestamp at the current position
3. Enter a title for the timestamp
4. Click the 💬 button to add detailed notes

### Section Dividers

Press `Alt+X` (default) to add a section divider — useful for marking:
- Intro/Outro
- Chapters
- Main content sections

### Exporting

- Click **Copy All** to copy all timestamps to clipboard
- Format: `01:23 Title (notes)`

### Importing

Click **Import** to paste existing timestamps from other sources.

### Customizing

Click the ⚙️ icon to configure:
- Keyboard shortcuts (record key + divider key)
- Text colors for dividers and comments
- Export format (prefix/suffix for dividers and comments)

## Development

```bash
# Install dependencies
bun install

# Development (watch mode)
bun run dev

# Production build
bun run build
```

### Project Structure

```
src/
├── main.ts       # Entry point, event listeners
├── store.ts      # Data layer (localStorage)
├── render.ts     # UI rendering
├── i18n.ts       # Internationalization
├── types.ts      # TypeScript interfaces
└── styles.css    # UI styling
```

### Tech Stack

- TypeScript (strict mode)
- Vite (build tool)
- No framework — vanilla DOM manipulation

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

This project follows strict TypeScript conventions. See [AGENTS.md](./AGENTS.md) for detailed guidelines.

## License

MIT License — feel free to use, modify, and distribute.
