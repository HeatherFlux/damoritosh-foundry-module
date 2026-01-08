# Damoritosh Arena - Hacking Viewer for Foundry VTT

A Foundry VTT module that embeds the [Damoritosh Arena](https://starfinderencounters.com) hacking network player view directly inside Foundry. No map recreation needed — just paste your player view link and go.

![Foundry v11+](https://img.shields.io/badge/Foundry-v11%2B-green)
![Latest Release](https://img.shields.io/badge/version-1.0.0-blue)

## Features

- **Embedded Viewer Window** - Resizable, draggable window displaying the hacking network
- **URL Management** - Paste any player view URL with automatic validation
- **Scene Persistence** - Save different hacking URLs per scene
- **Player Sharing** - Share to chat with one click; players can open the viewer too
- **Journal Handouts** - Create player-visible journal entries with the link
- **Host Allowlist** - Security control for allowed embed sources
- **V11/V12/V13 Support** - Works across Foundry versions

## Installation

### Manual Installation

1. Download the [latest release](https://github.com/HeatherFlux/damoritosh-foundry-module/releases)
2. Extract to your Foundry `Data/modules/` folder
3. Rename the folder to `damoritosh-hacking-viewer`
4. Restart Foundry and enable the module in your world

### Module Structure

```
damoritosh-hacking-viewer/
├── module.json
├── scripts/module.js
├── styles/module.css
├── templates/
└── lang/en.json
```

## Usage

### Opening the Viewer

1. Click the **network icon** (![network](https://img.icons8.com/ios/16/ffffff/network.png)) in the scene controls (left toolbar)
2. The Hacking Viewer window opens

### Loading a Hacking Network

1. In [Damoritosh Arena](https://starfinderencounters.com), create or load a hacking encounter
2. Click **Share** to get the player view URL
3. Paste the URL into the viewer's input field
4. Click the **play button** or press Enter

### Saving URLs

- **Save to Scene** - Stores the URL on the current scene; loads automatically when you return to this scene
- **Save to World** - Sets as the default URL for all scenes without a specific URL

### Sharing with Players

- **Share** - Posts a chat message with "Open Viewer" button that players can click
- **Journal** - Creates/updates a journal handout with instructions and an external link

### Viewer Controls

| Button | Action |
|--------|--------|
| ↻ | Reload the iframe |
| 📋 | Copy URL to clipboard |
| ↗ | Open in external browser |
| ✕ | Clear current URL |

## Configuration

Access settings via **Game Settings → Module Settings → Damoritosh Hacking Viewer**

| Setting | Description | Default |
|---------|-------------|---------|
| **Allowed Hosts** | Comma-separated hostnames permitted for embedding | `starfinderencounters.com` |
| **Allow Any Host** | Bypass host restrictions (unsafe) | Off |
| **Default URL** | World-wide fallback URL | Empty |
| **URL Storage Scope** | Prefer scene-specific or world URLs | Scene |
| **Players Can Open** | Allow players to open the viewer | On |
| **Show Diagnostics** | Display debug info in viewer | Off |
| **Journal Handout Name** | Name for created journal entries | `Hacking Network` |
| **Enable Bridge** | Allow postMessage communication with app | On |

## Troubleshooting

### White/Blank Iframe

The embedded site may be blocking iframes. Try:
1. Click **Open in Browser** to use an external tab instead
2. Check if the URL is correct and accessible
3. Verify the host is in your allowlist

### "Host not in allowlist" Error

Add the hostname to **Allowed Hosts** in settings, or enable **Allow Any Host** (not recommended for security).

### Players Can't See the Viewer

1. Ensure **Players Can Open** is enabled in settings
2. Use **Share** to post the link to chat
3. Players click "Open Viewer" in the chat message

### Diagnostics

Enable **Show Diagnostics** in settings to see:
- Foundry and module versions
- Current URL and load status
- Bridge connection state
- Error messages

## For Self-Hosters

If you're hosting your own instance of Damoritosh Arena:

1. Add your domain to **Allowed Hosts** (e.g., `localhost,myserver.com`)
2. Or enable **Allow Any Host** for development

## Development

```bash
# Install dependencies
npm install

# Build module
npm run build

# Watch for changes
npm run watch
```

## License

MIT

## Credits

- [Damoritosh Arena](https://starfinderencounters.com) - The hacking encounter web app
- Built for [Foundry VTT](https://foundryvtt.com)
