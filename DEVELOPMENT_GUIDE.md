# Foundry VTT Module Development Guide

A comprehensive guide to building Foundry VTT modules, covering V11, V12, and V13 compatibility.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Module Structure](#module-structure)
3. [The Module Manifest (module.json)](#the-module-manifest)
4. [The Hooks System](#the-hooks-system)
5. [Settings API](#settings-api)
6. [Scene Controls (V11/V12/V13)](#scene-controls)
7. [Application Windows](#application-windows)
8. [Flags API](#flags-api)
9. [Localization](#localization)
10. [Best Practices](#best-practices)
11. [Common Pitfalls](#common-pitfalls)

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A local Foundry VTT installation for testing
- Basic JavaScript/TypeScript knowledge

### Project Setup

```bash
mkdir my-foundry-module
cd my-foundry-module
npm init -y
npm install -D typescript vite
```

### TypeScript Configuration (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./scripts",
    "rootDir": "./src",
    "declaration": false,
    "sourceMap": true
  },
  "include": ["src/**/*"]
}
```

### Vite Configuration (vite.config.ts)

```typescript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'scripts',
    lib: {
      entry: resolve(__dirname, 'src/main.ts'),
      formats: ['es'],
      fileName: () => 'module.js'
    },
    sourcemap: true,
    minify: false  // Keep readable for debugging
  }
});
```

---

## Module Structure

```
my-module/
├── module.json           # Module manifest (REQUIRED)
├── scripts/
│   └── module.js         # Compiled JavaScript entry point
├── src/                  # TypeScript source (if using TS)
│   ├── main.ts
│   ├── compat.ts         # Version detection utilities
│   └── services/         # Business logic
├── styles/
│   └── module.css        # Module styles
├── templates/
│   └── my-template.hbs   # Handlebars templates
├── lang/
│   └── en.json           # Localization strings
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## The Module Manifest

The `module.json` file is required and tells Foundry about your module.

```json
{
  "id": "my-module-id",
  "title": "My Module Title",
  "description": "What my module does",
  "version": "1.0.0",
  "compatibility": {
    "minimum": "11",
    "verified": "13"
  },
  "authors": [
    {
      "name": "Your Name",
      "url": "https://your-website.com"
    }
  ],
  "esmodules": ["scripts/module.js"],
  "styles": ["styles/module.css"],
  "languages": [
    {
      "lang": "en",
      "name": "English",
      "path": "lang/en.json"
    }
  ],
  "url": "https://github.com/user/repo",
  "manifest": "https://github.com/user/repo/releases/latest/download/module.json",
  "download": "https://github.com/user/repo/releases/latest/download/module.zip"
}
```

### Key Fields

| Field | Description |
|-------|-------------|
| `id` | Unique identifier (lowercase, hyphens only) |
| `compatibility.minimum` | Minimum Foundry version required |
| `compatibility.verified` | Highest version tested |
| `esmodules` | ES module entry points (preferred over `scripts`) |
| `manifest` | URL to latest module.json for updates |
| `download` | URL to latest module.zip for installation |

---

## The Hooks System

Hooks are Foundry's event system. They let your module respond to game events.

### Essential Hooks

```typescript
// Module initialization - runs before game is ready
Hooks.once('init', () => {
  console.log('My Module | Initializing');
  // Register settings here
});

// Game is ready - safe to access game data
Hooks.once('ready', () => {
  console.log('My Module | Ready');
  // Access game.user, game.scenes, etc.
});

// Called on every hook of this type
Hooks.on('renderChatMessage', (message, html, data) => {
  // Modify chat messages
});

// Called only once, then auto-removes
Hooks.once('closeApplication', () => {
  // Cleanup code
});
```

### Common Hooks

| Hook | When | Parameters |
|------|------|------------|
| `init` | Module loading | none |
| `ready` | Game fully loaded | none |
| `renderChatMessage` | Chat message rendered | message, html, data |
| `getSceneControlButtons` | Scene controls built | controls |
| `renderActorSheet` | Actor sheet rendered | app, html, data |
| `updateActor` | Actor data changed | actor, changes, options, userId |
| `createToken` | Token created | token, options, userId |

---

## Settings API

Register persistent settings for your module.

```typescript
const MODULE_ID = 'my-module';

Hooks.once('init', () => {
  // World-level setting (GM only)
  game.settings.register(MODULE_ID, 'enableFeature', {
    name: 'Enable Feature',
    hint: 'Turn this feature on or off',
    scope: 'world',      // 'world' = GM only, 'client' = per-user
    config: true,        // Show in settings menu
    type: Boolean,
    default: true
  });

  // Client-level setting (per user)
  game.settings.register(MODULE_ID, 'uiScale', {
    name: 'UI Scale',
    scope: 'client',
    config: true,
    type: Number,
    default: 1.0,
    range: { min: 0.5, max: 2, step: 0.1 }
  });

  // Hidden setting (not in menu)
  game.settings.register(MODULE_ID, 'internalState', {
    scope: 'world',
    config: false,
    type: Object,
    default: {}
  });
});

// Read a setting
const enabled = game.settings.get(MODULE_ID, 'enableFeature');

// Write a setting
await game.settings.set(MODULE_ID, 'enableFeature', false);
```

### Setting Types

- `Boolean` - Checkbox
- `String` - Text input
- `Number` - Number input (use `range` for slider)
- `Object` - Hidden, stores complex data
- `Array` - Hidden, stores arrays

---

## Scene Controls

**CRITICAL: V13 changed the API completely!**

### Version Detection

```typescript
function isV13(): boolean {
  return foundry.utils.isNewerVersion(game.version, '12.999');
}

function isV12(): boolean {
  return foundry.utils.isNewerVersion(game.version, '11.999');
}
```

### V11/V12: Array-based Controls

```typescript
Hooks.on('getSceneControlButtons', (controls) => {
  // controls is an ARRAY in V11/V12
  controls.push({
    name: 'my-controls',
    title: 'My Controls',
    icon: 'fas fa-cog',
    layer: 'controls',
    visible: game.user.isGM,
    tools: [
      {
        name: 'my-tool',
        title: 'My Tool',
        icon: 'fas fa-wrench',
        onClick: () => {
          console.log('Tool clicked!');
        },
        button: true  // One-shot action
      }
    ],
    activeTool: 'my-tool'
  });
});
```

### V13: Object-based Controls

```typescript
Hooks.on('getSceneControlButtons', (controls) => {
  // controls is an OBJECT in V13: { tokens: {...}, notes: {...}, ... }
  // Each control has a 'tools' object

  if (controls.tokens?.tools) {
    controls.tokens.tools.myTool = {
      name: 'myTool',
      title: 'my-module.myTool',  // Localization key
      icon: 'fa-solid fa-wrench', // V13 uses fa-solid, not fas
      order: Object.keys(controls.tokens.tools).length,
      button: true,   // One-shot action (required!)
      visible: game.user.isGM,
      onChange: () => {  // REQUIRED in V13!
        console.log('Tool clicked!');
      }
    };
  }
});
```

### Cross-Version Compatible Code

```typescript
function registerSceneControls(): void {
  Hooks.on('getSceneControlButtons', (controls) => {
    const visible = game.user.isGM;
    if (!visible) return;

    if (isV13()) {
      // V13: Add tool to existing control's tools object
      if (controls.tokens?.tools) {
        controls.tokens.tools.myTool = {
          name: 'myTool',
          title: 'my-module.controls.myTool',
          icon: 'fa-solid fa-star',
          order: Object.keys(controls.tokens.tools).length,
          button: true,
          visible,
          onChange: () => openMyWindow()
        };
      }
    } else {
      // V11/V12: Push new control group to array
      controls.push({
        name: 'my-controls',
        title: 'My Controls',
        icon: 'fas fa-star',
        layer: 'controls',
        visible,
        tools: [{
          name: 'my-tool',
          title: 'My Tool',
          icon: 'fas fa-star',
          onClick: () => openMyWindow(),
          button: true
        }],
        activeTool: 'my-tool'
      });
    }
  });
}
```

### V13 Tool Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | string | Yes | Unique identifier |
| `title` | string | Yes | Localization key or display text |
| `icon` | string | Yes | FontAwesome class (`fa-solid fa-icon`) |
| `order` | number | No | Sort order in toolbar |
| `button` | boolean | Required* | One-shot action (no toggle state) |
| `toggle` | boolean | Required* | Toggle on/off state |
| `visible` | boolean | No | Whether tool is visible |
| `onChange` | function | Yes | Called when clicked |

*Either `button` or `toggle` must be `true`

---

## Application Windows

### V12+ ApplicationV2 (Recommended)

```typescript
export function createMyAppClass() {
  const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

  return class MyApp extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
      id: 'my-app',
      classes: ['my-module'],
      tag: 'div',
      window: {
        frame: true,
        positioned: true,
        title: 'My Application',
        icon: 'fa-solid fa-cog',
        resizable: true,
        minimizable: true
      },
      position: {
        width: 600,
        height: 400
      },
      actions: {
        save: MyApp.onSave,
        cancel: MyApp.onCancel
      }
    };

    static PARTS = {
      main: {
        template: 'modules/my-module/templates/app.hbs'
      }
    };

    async _prepareContext(options) {
      const context = await super._prepareContext?.(options) ?? {};
      return foundry.utils.mergeObject(context, {
        myData: 'Hello World'
      });
    }

    static async onSave() {
      console.log('Save clicked');
    }

    static onCancel() {
      this.close();
    }
  };
}
```

### V11 Application (Legacy)

```typescript
export function createMyAppV1Class() {
  return class MyApp extends Application {
    static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
        id: 'my-app',
        classes: ['my-module'],
        template: 'modules/my-module/templates/app.hbs',
        width: 600,
        height: 400,
        resizable: true,
        title: 'My Application'
      });
    }

    getData(options = {}) {
      return {
        myData: 'Hello World'
      };
    }

    activateListeners(html) {
      super.activateListeners(html);
      html.find('[data-action="save"]').on('click', () => {
        console.log('Save clicked');
      });
    }
  };
}
```

### Template (Handlebars)

```handlebars
<!-- templates/app.hbs -->
<div class="my-app-container">
  <h2>{{myData}}</h2>

  <div class="form-group">
    <label for="input-field">Enter Text:</label>
    <input type="text" id="input-field" name="text" value="">
  </div>

  <footer class="form-footer">
    <button type="button" data-action="save">
      <i class="fas fa-save"></i> Save
    </button>
    <button type="button" data-action="cancel">
      <i class="fas fa-times"></i> Cancel
    </button>
  </footer>
</div>
```

---

## Flags API

Store custom data on documents (actors, items, scenes, etc.).

```typescript
const MODULE_ID = 'my-module';

// Set a flag
await actor.setFlag(MODULE_ID, 'customData', { value: 42 });

// Get a flag
const data = actor.getFlag(MODULE_ID, 'customData');
// Returns: { value: 42 }

// Unset a flag
await actor.unsetFlag(MODULE_ID, 'customData');

// Update nested flag data
await actor.setFlag(MODULE_ID, 'customData.value', 100);
```

### Flag Scopes

Flags can be set on any document:

- `game.actors` - Actors
- `game.items` - Items
- `game.scenes` - Scenes
- `game.users` - Users
- `game.journal` - Journal entries
- `game.messages` - Chat messages

---

## Localization

### lang/en.json

```json
{
  "my-module": {
    "settings": {
      "enableFeature": {
        "name": "Enable Feature",
        "hint": "Turn this feature on or off"
      }
    },
    "controls": {
      "title": "My Module",
      "openWindow": "Open Window"
    },
    "ui": {
      "save": "Save",
      "cancel": "Cancel"
    }
  }
}
```

### Using Localization

```typescript
// Simple string
const text = game.i18n.localize('my-module.ui.save');

// With substitutions
const formatted = game.i18n.format('my-module.greeting', {
  name: 'Player'
});
// In en.json: "greeting": "Hello, {name}!"
// Returns: "Hello, Player!"
```

---

## Best Practices

### 1. Version Detection at Init Time

```typescript
let ViewerClass;

Hooks.once('init', () => {
  if (isV12()) {
    ViewerClass = createV2Class();
  } else {
    ViewerClass = createV1Class();
  }
});
```

### 2. Use Modern ES Modules

```javascript
// module.json
{
  "esmodules": ["scripts/module.js"]  // Preferred
  // NOT: "scripts": ["scripts/module.js"]
}
```

### 3. Namespace Everything

```typescript
const MODULE_ID = 'my-module';

// Settings
game.settings.register(MODULE_ID, 'mySetting', ...);

// Flags
actor.setFlag(MODULE_ID, 'myData', ...);

// Hooks
Hooks.call(`${MODULE_ID}.myCustomEvent`, data);
```

### 4. Handle Missing Data Gracefully

```typescript
// Always check for existence
const scene = game.scenes?.active;
if (!scene) return;

const flag = scene.getFlag(MODULE_ID, 'data') ?? defaultValue;
```

### 5. Clean Up on Close

```typescript
Hooks.once('close', () => {
  // Remove event listeners
  // Clear intervals/timeouts
  // Null out references
});
```

### 6. Use Foundry Utilities

```typescript
// Deep merge objects
const merged = foundry.utils.mergeObject(target, source);

// Compare versions
const isNewer = foundry.utils.isNewerVersion('12.0', '11.0');

// Generate UUIDs
const id = foundry.utils.randomID();

// Debounce functions
const debouncedSave = foundry.utils.debounce(save, 500);
```

---

## Common Pitfalls

### 1. Accessing Game Before Ready

```typescript
// WRONG - game.user may not exist
Hooks.once('init', () => {
  if (game.user.isGM) { /* ... */ }  // ERROR!
});

// CORRECT - wait for ready
Hooks.once('ready', () => {
  if (game.user.isGM) { /* ... */ }  // Safe
});
```

### 2. Infinite Render Loops

```typescript
// WRONG - causes infinite loop
iframe.addEventListener('load', () => {
  this.render();  // Triggers new load event!
});

// CORRECT - use a guard
private _listenersAttached = false;

_attachListeners() {
  if (this._listenersAttached) return;
  this._listenersAttached = true;

  iframe.addEventListener('load', () => {
    this._onLoad();  // Don't re-render
  });
}
```

### 3. V13 Scene Controls Without onChange

```typescript
// WRONG - will crash in V13
controls.tokens.tools.myTool = {
  name: 'myTool',
  icon: 'fa-solid fa-star',
  button: true
  // Missing onChange!
};

// CORRECT
controls.tokens.tools.myTool = {
  name: 'myTool',
  icon: 'fa-solid fa-star',
  button: true,
  onChange: () => doSomething()  // Required!
};
```

### 4. Wrong FontAwesome Syntax

```typescript
// V11/V12 style
icon: 'fas fa-star'

// V13 style (also works in V12)
icon: 'fa-solid fa-star'
```

### 5. Blocking the UI Thread

```typescript
// WRONG - blocks UI
for (let i = 0; i < 10000; i++) {
  processItem(items[i]);
}

// CORRECT - yield to UI
async function processItems(items) {
  for (const item of items) {
    await processItem(item);
    await new Promise(r => setTimeout(r, 0));  // Yield
  }
}
```

### 6. Not Handling Permissions

```typescript
// WRONG - assumes GM
await actor.update({ 'system.hp': 100 });

// CORRECT - check permissions
if (actor.canUserModify(game.user, 'update')) {
  await actor.update({ 'system.hp': 100 });
} else {
  ui.notifications.warn('You lack permission');
}
```

---

## Debugging Tips

### Console Logging

```typescript
// Prefix all logs for filtering
console.log('my-module |', 'Message here');
console.warn('my-module |', 'Warning');
console.error('my-module |', 'Error');
```

### Foundry DevTools

Press F12 to open browser DevTools. Useful panels:

- **Console**: View logs and errors
- **Network**: Watch for failed requests
- **Sources**: Debug JavaScript

### Inspect Game State

```javascript
// In browser console:
game.modules.get('my-module')    // Module instance
game.settings.get('my-module', 'setting')  // Settings
game.scenes.active               // Active scene
game.user                        // Current user
```

---

## Resources

- [Foundry VTT API Documentation](https://foundryvtt.com/api/)
- [Foundry VTT Wiki](https://foundryvtt.wiki/)
- [League of Foundry Developers Discord](https://discord.gg/foundryvtt-dev)
- [Foundry VTT GitHub](https://github.com/foundryvtt)

---

## Version History

- **V13** (2024): Object-based scene controls, ApplicationV2 improvements
- **V12** (2024): ApplicationV2 with HandlebarsApplicationMixin
- **V11** (2023): Last version with classic Application class

---

*This guide is part of the Damoritosh Arena - Hacking Viewer module.*
