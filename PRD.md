Product Spec: Damoritosh Arena – Foundry Hacking Viewer Module
1) Problem Statement

GMs running Starfinder (or adjacent) games in Foundry want a table-friendly visual of a generated hacking network during play. Your web app already generates a player view link that renders the network well. Journal iframes are unreliable due to Foundry sanitization and sandboxing; therefore the module must provide a first-class in-Foundry window and workflow glue around your existing player view.

2) Goals and Non-Goals
Goals

Reliable in-Foundry display of the player view (no white screens caused by journal sandboxing).

Fast workflow: paste a player view link → open viewer → share to players.

Low maintenance: no reimplementation of graph rendering, no fragile canvas drawing in Foundry.

State persistence in Foundry (store “current session link” per Scene or per world).

Player-friendly access: players can open the same view in Foundry (if permissions allow) or via external browser.

Upgrade-friendly across Foundry core versions.

Non-Goals (for v1)

Rebuilding the network as a Foundry Scene with Tiles/Walls/Tokens.

Deep automation of Foundry mechanics (rolls, macros tied to network nodes).

Handling sensitive authentication inside Foundry; the player view link should be shareable.

3) Target Users

GM (Primary): generates sessions in your app, needs to display the network in Foundry.

Player (Secondary): sees the network view during hacking scenes; may interact if your player view supports it.

4) Supported Foundry Versions

Foundry V12 as primary target.

V11 as secondary if you want wider adoption.

Use ApplicationV2 where possible; keep a fallback for V11.

5) Key User Journeys
Journey A: GM uses player view during a session (MVP)

GM opens module tool (“Hacking Viewer”).

GM pastes the player view URL from your app.

Module validates/sanitizes URL and stores it.

GM clicks “Open Viewer” (pop-out resizable window).

GM clicks “Share to Players”:

Posts a chat message with the link

Optionally creates/updates a Journal entry the players can open (link + instructions)

Players open it:

Ideally inside Foundry viewer window (module exposes a player UI too)

Or in external browser if desired

Journey B: Persist by Scene (nice-to-have for play)

GM opens Scene “Hacking: Corp Server”

Module auto-loads the last used link for that Scene

GM opens viewer; players follow along

6) Feature Set (v1 “Fully Featured” but Maintainable)
6.1 Viewer Window (core)

Resizable, dockable/popup window rendering an <iframe> to the player view URL.

Controls:

Open

Pop out

Reload

Open in External Browser

Copy Link

Status indicators:

“Loaded URL host: starfinderencounters.com”

Lightweight error display when the iframe fails (e.g., frame blocked)

Acceptance criteria

Works even when Journal iframe fails (no enforced sandbox).

Window persists while GM navigates.

6.2 URL Management and Validation

Accept:

Full URL with protocol

URL without protocol (auto-prepend https://)

Validate:

Allowed host(s) default to starfinderencounters.com (configurable)

Must include #/hacking/view (or a set of permitted paths)

Normalize:

Decode and re-encode if needed

Strip whitespace

Optional: parse query params for session and state and show a summary (“Session: ce74b1c3”).

Acceptance criteria

Pasting “starfinderencounters.com/#/hacking/view?…” still works.

Invalid/unknown host warns (does not hard fail unless GM sets “strict host allowlist”).

6.3 Persistence & Scoping (World / Scene / Actor)

Provide three storage options, controlled by settings:

World default URL (simple)

Scene-specific URL (recommended for play)

(Optional) Actor/Item flags if you later want “hacking deck” items to store links

Implementation approach:

Use Foundry flags on Scene for scene-specific storage.

Use game.settings for world defaults.

Acceptance criteria

Scene remembers its last URL across reloads.

GM can clear/reset.

6.4 Player Access & Permissions

A “Player Mode” viewer:

Players can open the viewer if they have permission OR if GM shares it.

Share mechanisms:

Chat message with “Open Viewer” button (runs a macro-like command).

Optional Journal entry creation (“Hacking Network View”) with clear instructions + external link fallback.

Permissions model:

Only GM can set/update URLs by default.

Players can open the viewer to the currently shared URL.

Acceptance criteria

Players can open without needing to edit HTML journals.

GM retains control over what is displayed.

6.5 Safety Controls (to reduce support burden)

Allowlist hosts (default starfinderencounters.com).

Optional setting: “Allow any host (unsafe)” for self-hosters.

“Always show external link fallback” if iframe fails.

6.6 Diagnostics & Supportability

“Show Diagnostics” panel:

Current Foundry version

Module version

Current URL (redacted option for stream screenshots)

iframe load events

Clear errors when frame is blocked:

Detect typical CSP/XFO failures (as best as possible) and display: “Embedding blocked by site headers. Use Open in Browser.”

Acceptance criteria

Reduces GitHub issues that are “it’s white.”

6.7 Optional Bridge (v1.1+)

If you want limited interaction between Foundry and your app without tight coupling:

Use window.postMessage to send/receive events:

Foundry → App: “setTheme”, “setZoom”, “ping”

App → Foundry: “nodeSelected”, “alarmTriggered”

Keep it optional and versioned so your app can ignore unknown messages.

Acceptance criteria

Works when same-origin constraints allow (you control both ends).

Fails gracefully when not supported.

7) UX / UI Design
Primary UI: “Hacking Viewer” sidebar/tool

Sections:

Source

URL input

“Use World Default”

“Use Scene URL”

“Save”

Open

“Open Viewer”

“Pop Out”

“Reload”

Share

“Send to Chat”

“Create/Update Journal Handout”

Advanced

Host allowlist

Allow external

Diagnostics

Player UI

A minimal viewer that opens the currently shared URL.

No edit controls.

8) Technical Architecture (Designed for Maintainability)
Design principle

Keep Foundry as thin as possible.
Your app continues to:

render the graph

handle simulation UI

own session/state encoding

The module does:

store/share URLs and context

display iframe windows reliably

manage Foundry UX and permissions

Code structure

module.json

src/

main.ts (hooks, settings, API registration)

ui/ViewerApp.ts (ApplicationV2)

ui/ConfigApp.ts (optional settings UI)

services/url.ts (normalize/validate)

services/storage.ts (settings/flags)

services/share.ts (chat/journal helpers)

services/diagnostics.ts

Build system: minimal (Vite + TypeScript) with a single bundle output.

Compatibility strategy

Prefer Foundry V12 ApplicationV2.

Provide small compatibility shims for V11 if needed.

Avoid deep DOM hacks; use Foundry APIs.

Release discipline

Semantic versioning aligned to Foundry major compatibility:

1.x supports V12

0.9.x supports V11 (if you maintain)

9) Settings (Proposed)

Default Player View Host Allowlist: ["starfinderencounters.com"]

Allow Any Host: boolean (default false)

Default Storage Scope: world | scene (default scene)

Players Can Open Viewer: boolean (default true)

Auto-post link on update: boolean (default false)

Journal Handout Name: string (default “Hacking Network”)

Diagnostics Mode: boolean (default false)

10) Testing Plan (Practical)
Manual test matrix

Foundry V12 on:

Chrome

Firefox

GM workflow:

paste URL → open viewer

scene save/load

share to chat → player opens

Failure modes:

invalid URL

URL without protocol

iframe blocked (simulate by pointing to a blocked site)

player permissions denied

Automated tests (lightweight)

Unit tests for URL normalization/validation and storage scoping.

Avoid E2E unless you already run it; it’s expensive for Foundry.

11) Roadmap
v1.0 (ship this)

Viewer window (GM + Player)

URL validation + host allowlist

Scene/world persistence

Share to chat + external link fallback

Diagnostics panel

v1.1

“Create/Update Journal handout” helper

Optional postMessage bridge (read-only events)

v1.2

“Encounter integration” stub: attach a link to a Journal/Scene/Actor via flags

“Quick open” button on Scene controls

v2.0 (only if demand)

True Foundry canvas visualization (tiles/tokens/lines)

Node state tracking via Foundry flags

Bidirectional syncing with your app (requires a stable message schema)

12) Maintenance Strategy (Keeping it easy alongside your app)

Treat the module as a thin shell that depends on your app URL contract:

“player view link is stable”

optional postMessage schema, versioned

Avoid duplicating business logic (network parsing, layout, etc.).

Keep the module’s UI stable; changes should mostly be in your web app.

Operationally: you can release Foundry module updates only when:

Foundry breaks APIs (major upgrades)

you add share/UX improvements

you introduce a new embed path

13) Copy for your GitHub README (positioning)

“This module embeds the Damoritosh Arena hacking network player view inside Foundry.”

“No map recreation; uses the official viewer link generated by the web app.”

“If embedding is blocked by host headers, use ‘Open in Browser’.”