# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
npm run build    # Build module to scripts/module.js
npm run watch    # Watch mode for development
```

After building, copy the module to Foundry's modules folder:
```bash
cp -r . ~/.local/share/FoundryVTT/Data/modules/damoritosh-hacking-viewer
```

## Architecture

This is a Foundry VTT module that embeds the Damoritosh Arena hacking network player view (from starfinderencounters.com) in an iframe window.

### Version Compatibility

The module supports Foundry V11, V12, and V13 through two separate Application classes:
- `ViewerAppV2.ts` - Uses Foundry V12+ `ApplicationV2` with `HandlebarsApplicationMixin`
- `ViewerAppV1.ts` - Uses classic `Application` class for V11

Version detection happens in `compat.ts` via `isV12()`, and `main.ts` instantiates the appropriate class at runtime.

### Source Structure

- `src/main.ts` - Entry point: registers hooks, settings, scene controls, and exposes module API
- `src/ui/viewer-shared.ts` - Shared state and actions used by both V1/V2 viewers
- `src/services/` - Core functionality:
  - `url.ts` - URL validation, normalization, host allowlist checking
  - `storage.ts` - Foundry settings registration and flag management (scene/world/actor/item)
  - `share.ts` - Chat message sharing with interactive buttons
  - `journal.ts` - Journal handout creation/update
  - `bridge.ts` - postMessage communication with embedded app

### Foundry Integration Points

- Scene controls: Adds "Hacking Viewer" button to left toolbar via `getSceneControlButtons` hook
- Chat: Interactive buttons in shared messages via `renderChatMessage` hook
- Settings: Registered in `init` hook, includes host allowlist, storage scope, permissions
- Flags: Scene-specific URLs stored via `scene.setFlag()`, also supports Actor/Item flags

### Templates

Handlebars templates in `templates/` are used by both V1 and V2 Application classes. The viewer template includes GM-only config panel and player-facing iframe display.
