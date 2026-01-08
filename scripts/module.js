var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
const MODULE_ID = "damoritosh-hacking-viewer";
function isV12() {
  return foundry.utils.isNewerVersion(game.version, "11.999");
}
function getModuleVersion() {
  const module = game.modules.get(MODULE_ID);
  return (module == null ? void 0 : module.version) ?? "0.0.0";
}
function getFoundryVersion() {
  return game.version ?? "unknown";
}
function isGM() {
  var _a;
  return ((_a = game.user) == null ? void 0 : _a.isGM) ?? false;
}
function log(...args) {
  console.log(`${MODULE_ID} |`, ...args);
}
function warn(...args) {
  console.warn(`${MODULE_ID} |`, ...args);
}
function localize(key) {
  var _a;
  return ((_a = game.i18n) == null ? void 0 : _a.localize(`${MODULE_ID}.${key}`)) ?? key;
}
function registerSettings() {
  const gs = game.settings;
  gs.register(MODULE_ID, "hostAllowlist", {
    name: `${MODULE_ID}.settings.hostAllowlist.name`,
    hint: `${MODULE_ID}.settings.hostAllowlist.hint`,
    scope: "world",
    config: true,
    type: String,
    default: "starfinderencounters.com"
  });
  gs.register(MODULE_ID, "allowAnyHost", {
    name: `${MODULE_ID}.settings.allowAnyHost.name`,
    hint: `${MODULE_ID}.settings.allowAnyHost.hint`,
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });
  gs.register(MODULE_ID, "defaultUrl", {
    name: `${MODULE_ID}.settings.defaultUrl.name`,
    hint: `${MODULE_ID}.settings.defaultUrl.hint`,
    scope: "world",
    config: true,
    type: String,
    default: ""
  });
  gs.register(MODULE_ID, "storageScope", {
    name: `${MODULE_ID}.settings.storageScope.name`,
    hint: `${MODULE_ID}.settings.storageScope.hint`,
    scope: "world",
    config: true,
    type: String,
    default: "scene",
    choices: {
      world: `${MODULE_ID}.settings.storageScope.world`,
      scene: `${MODULE_ID}.settings.storageScope.scene`
    }
  });
  gs.register(MODULE_ID, "playersCanOpen", {
    name: `${MODULE_ID}.settings.playersCanOpen.name`,
    hint: `${MODULE_ID}.settings.playersCanOpen.hint`,
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });
  gs.register(MODULE_ID, "diagnosticsMode", {
    name: `${MODULE_ID}.settings.diagnosticsMode.name`,
    hint: `${MODULE_ID}.settings.diagnosticsMode.hint`,
    scope: "client",
    config: true,
    type: Boolean,
    default: false
  });
  gs.register(MODULE_ID, "journalHandoutName", {
    name: `${MODULE_ID}.settings.journalHandoutName.name`,
    hint: `${MODULE_ID}.settings.journalHandoutName.hint`,
    scope: "world",
    config: true,
    type: String,
    default: "Hacking Network"
  });
  gs.register(MODULE_ID, "enableBridge", {
    name: `${MODULE_ID}.settings.enableBridge.name`,
    hint: `${MODULE_ID}.settings.enableBridge.hint`,
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });
  gs.register(MODULE_ID, "autoPostOnShare", {
    name: `${MODULE_ID}.settings.autoPostOnShare.name`,
    hint: `${MODULE_ID}.settings.autoPostOnShare.hint`,
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });
  gs.register(MODULE_ID, "currentSharedUrl", {
    scope: "world",
    config: false,
    type: String,
    default: ""
  });
  log("Settings registered");
}
function getSetting(key) {
  return game.settings.get(MODULE_ID, key);
}
async function setSetting(key, value) {
  await game.settings.set(MODULE_ID, key, value);
}
function getStorageScope() {
  return getSetting("storageScope");
}
function getCurrentUrl(scene) {
  var _a;
  const scope = getStorageScope();
  if (scope === "scene") {
    const activeScene = (_a = game.scenes) == null ? void 0 : _a.active;
    if (activeScene) {
      const sceneUrl = activeScene.getFlag(MODULE_ID, "sceneUrl");
      if (sceneUrl) return sceneUrl;
    }
  }
  return getSetting("defaultUrl") || "";
}
async function setSceneUrl(scene, url) {
  await (scene == null ? void 0 : scene.setFlag(MODULE_ID, "sceneUrl", url));
  log(`Scene URL set: ${url}`);
}
async function setWorldUrl(url) {
  await setSetting("defaultUrl", url);
  log(`World default URL set: ${url}`);
}
function getSharedUrl() {
  return getSetting("currentSharedUrl") || "";
}
async function setSharedUrl(url) {
  await setSetting("currentSharedUrl", url);
  log(`Shared URL set: ${url}`);
}
function canPlayersOpen() {
  return getSetting("playersCanOpen");
}
function isDiagnosticsEnabled() {
  return getSetting("diagnosticsMode");
}
function isBridgeEnabled() {
  return getSetting("enableBridge");
}
const DEFAULT_ALLOWLIST = ["starfinderencounters.com"];
const VALID_PATH_PATTERNS = [
  "#/hacking/view",
  "/#/hacking/view"
];
function normalizeUrl(input) {
  let url = input.trim();
  if (url && !url.match(/^https?:\/\//i)) {
    url = `https://${url}`;
  }
  return url;
}
function getHost(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return "";
  }
}
function isHostAllowed(url, allowlist) {
  const host = getHost(url);
  if (!host) return false;
  return allowlist.some((allowed) => {
    return host === allowed || host.endsWith(`.${allowed}`);
  });
}
function hasValidPath(url) {
  return VALID_PATH_PATTERNS.some((pattern) => url.includes(pattern));
}
function extractSessionId(url) {
  try {
    const hashIndex = url.indexOf("#");
    if (hashIndex === -1) return void 0;
    const hashPart = url.substring(hashIndex + 1);
    const queryIndex = hashPart.indexOf("?");
    if (queryIndex === -1) return void 0;
    const queryString = hashPart.substring(queryIndex + 1);
    const params = new URLSearchParams(queryString);
    return params.get("session") ?? void 0;
  } catch {
    return void 0;
  }
}
function getAllowlist() {
  try {
    const setting = game.settings.get(MODULE_ID, "hostAllowlist");
    return setting.split(",").map((h) => h.trim()).filter(Boolean);
  } catch {
    return DEFAULT_ALLOWLIST;
  }
}
function isAnyHostAllowed() {
  try {
    return game.settings.get(MODULE_ID, "allowAnyHost");
  } catch {
    return false;
  }
}
function validateUrl(input) {
  if (!input || !input.trim()) {
    return {
      valid: false,
      normalized: "",
      host: "",
      error: "URL is required"
    };
  }
  const normalized = normalizeUrl(input);
  const host = getHost(normalized);
  if (!host) {
    return {
      valid: false,
      normalized,
      host: "",
      error: "Invalid URL format"
    };
  }
  const allowAny = isAnyHostAllowed();
  const allowlist = getAllowlist();
  if (!allowAny && !isHostAllowed(normalized, allowlist)) {
    return {
      valid: false,
      normalized,
      host,
      error: `Host "${host}" is not in the allowlist. Allowed: ${allowlist.join(", ")}`
    };
  }
  const hasPath = hasValidPath(normalized);
  const sessionId = extractSessionId(normalized);
  return {
    valid: true,
    normalized,
    host,
    sessionId,
    error: hasPath ? void 0 : "URL does not appear to be a hacking view link"
  };
}
function formatSessionDisplay(sessionId) {
  if (!sessionId) return "";
  if (sessionId.length <= 8) return sessionId;
  return `${sessionId.substring(0, 8)}...`;
}
const BRIDGE_VERSION = 1;
const messageHandlers = /* @__PURE__ */ new Map();
let currentIframe = null;
let bridgeConnected = false;
function isAllowedOrigin(origin) {
  if (isAnyHostAllowed()) return true;
  const allowlist = getAllowlist();
  try {
    const url = new URL(origin);
    const host = url.hostname;
    return allowlist.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
  } catch {
    return false;
  }
}
function handleMessage(event) {
  if (!isBridgeEnabled()) return;
  if (!isAllowedOrigin(event.origin)) {
    return;
  }
  const message = event.data;
  if (!message || typeof message.type !== "string") {
    return;
  }
  log("Bridge received:", message.type, message.payload);
  if (message.type === "pong") {
    bridgeConnected = true;
    log("Bridge connection confirmed");
    return;
  }
  const handlers = messageHandlers.get(message.type);
  if (handlers) {
    handlers.forEach((handler) => {
      try {
        handler(message.payload);
      } catch (err) {
        warn("Bridge handler error:", err);
      }
    });
  }
  Hooks.callAll(`${MODULE_ID}.bridgeMessage`, message);
}
function initBridge() {
  if (!isBridgeEnabled()) {
    log("Bridge disabled by settings");
    return;
  }
  window.addEventListener("message", handleMessage);
  log("Bridge initialized");
}
function destroyBridge() {
  window.removeEventListener("message", handleMessage);
  currentIframe = null;
  bridgeConnected = false;
  log("Bridge destroyed");
}
function setIframe(iframe) {
  currentIframe = iframe;
  bridgeConnected = false;
  if (iframe && isBridgeEnabled()) {
    setTimeout(() => {
      sendToApp({ type: "ping", version: BRIDGE_VERSION, payload: {} });
    }, 1e3);
  }
}
function sendToApp(message) {
  if (!(currentIframe == null ? void 0 : currentIframe.contentWindow)) {
    warn("Cannot send to app: no iframe available");
    return false;
  }
  if (!isBridgeEnabled()) {
    return false;
  }
  try {
    currentIframe.contentWindow.postMessage(message, "*");
    log("Bridge sent:", message.type);
    return true;
  } catch (err) {
    warn("Bridge send error:", err);
    return false;
  }
}
function onMessage(type, handler) {
  const handlers = messageHandlers.get(type) || [];
  handlers.push(handler);
  messageHandlers.set(type, handlers);
  return () => {
    const current = messageHandlers.get(type) || [];
    const index = current.indexOf(handler);
    if (index !== -1) {
      current.splice(index, 1);
      messageHandlers.set(type, current);
    }
  };
}
function isBridgeConnected() {
  return bridgeConnected;
}
function setupDefaultHandlers() {
  onMessage("nodeSelected", (payload) => {
    var _a;
    const data = payload;
    (_a = ui.notifications) == null ? void 0 : _a.info(`Node selected: ${data.nodeName}`);
  });
  onMessage("alarmTriggered", (payload) => {
    var _a;
    const data = payload;
    (_a = ui.notifications) == null ? void 0 : _a.warn(`Alarm Level: ${data.level}`);
  });
  onMessage("stateChanged", (payload) => {
    log("App state changed:", payload);
  });
  log("Default bridge handlers registered");
}
async function shareToChat(url) {
  var _a, _b;
  const validation = validateUrl(url);
  if (!validation.valid) {
    (_a = ui.notifications) == null ? void 0 : _a.error(validation.error);
    return;
  }
  if (isGM()) {
    await setSharedUrl(validation.normalized);
  }
  const sessionDisplay = formatSessionDisplay(validation.sessionId);
  const hostDisplay = validation.host;
  const content = `
    <div class="${MODULE_ID}-chat-message">
      <h3><i class="fas fa-network-wired"></i> Hacking Network Shared</h3>
      <p class="host-info">Host: <strong>${hostDisplay}</strong></p>
      ${sessionDisplay ? `<p class="session-info">Session: <code>${sessionDisplay}</code></p>` : ""}
      <div class="button-row">
        <button type="button" class="${MODULE_ID}-open-viewer" data-url="${encodeURIComponent(validation.normalized)}">
          <i class="fas fa-display"></i> Open Viewer
        </button>
        <a href="${validation.normalized}" target="_blank" class="external-link">
          <i class="fas fa-external-link-alt"></i> Open in Browser
        </a>
      </div>
    </div>
  `;
  await ChatMessage.create({
    content,
    // @ts-expect-error - Foundry global
    speaker: ChatMessage.getSpeaker(),
    flags: {
      [MODULE_ID]: {
        isShareMessage: true,
        url: validation.normalized
      }
    }
  });
  log("Shared to chat:", validation.normalized);
  (_b = ui.notifications) == null ? void 0 : _b.info(localize("notifications.shared"));
}
function onRenderChatMessage(_message, html, _data) {
  var _a;
  const element = ((_a = html.get) == null ? void 0 : _a.call(html, 0)) ?? html;
  const button = element.querySelector(`.${MODULE_ID}-open-viewer`);
  if (!button) return;
  button.addEventListener("click", (event) => {
    var _a2;
    event.preventDefault();
    const target = event.currentTarget;
    const encodedUrl = target.dataset.url;
    if (!encodedUrl) return;
    const url = decodeURIComponent(encodedUrl);
    const module = game.modules.get(MODULE_ID);
    if ((_a2 = module == null ? void 0 : module.api) == null ? void 0 : _a2.openViewer) {
      module.api.openViewer(url);
    } else {
      Hooks.callAll(`${MODULE_ID}.openViewer`, url);
    }
  });
}
function getHandoutName() {
  return getSetting("journalHandoutName") || "Hacking Network";
}
function findHandoutJournal() {
  var _a;
  const name = getHandoutName();
  return (_a = game.journal) == null ? void 0 : _a.getName(name);
}
function createHandoutContent(url, host, sessionId) {
  const sessionDisplay = formatSessionDisplay(sessionId);
  return `
    <div class="${MODULE_ID}-journal-content">
      <h2><i class="fas fa-network-wired"></i> Hacking Network View</h2>

      <div class="info-section">
        <p><strong>Host:</strong> ${host}</p>
        ${sessionDisplay ? `<p><strong>Session:</strong> <code>${sessionDisplay}</code></p>` : ""}
      </div>

      <div class="instructions">
        <h3>How to Open</h3>
        <ol>
          <li>Click the <strong>Open Viewer</strong> button in the scene controls (left toolbar)</li>
          <li>Or use the button below to open in a new browser tab</li>
        </ol>
      </div>

      <div class="action-buttons">
        <p>
          <a href="${url}" target="_blank" class="button">
            <i class="fas fa-external-link-alt"></i> Open in Browser
          </a>
        </p>
      </div>

      <div class="notes">
        <p><em>Note: If the viewer doesn't load inside Foundry, use the external browser link above.</em></p>
      </div>
    </div>

    <style>
      .${MODULE_ID}-journal-content {
        padding: 10px;
      }
      .${MODULE_ID}-journal-content h2 {
        border-bottom: 2px solid #7a7971;
        padding-bottom: 5px;
        margin-bottom: 15px;
      }
      .${MODULE_ID}-journal-content .info-section {
        background: rgba(0,0,0,0.05);
        padding: 10px;
        border-radius: 5px;
        margin-bottom: 15px;
      }
      .${MODULE_ID}-journal-content .info-section p {
        margin: 5px 0;
      }
      .${MODULE_ID}-journal-content code {
        background: rgba(0,0,0,0.1);
        padding: 2px 6px;
        border-radius: 3px;
        font-family: monospace;
      }
      .${MODULE_ID}-journal-content .instructions {
        margin-bottom: 15px;
      }
      .${MODULE_ID}-journal-content .instructions ol {
        margin-left: 20px;
      }
      .${MODULE_ID}-journal-content .action-buttons .button {
        display: inline-block;
        background: #4b4a44;
        color: #f0f0e0;
        padding: 8px 16px;
        border-radius: 5px;
        text-decoration: none;
        transition: background 0.2s;
      }
      .${MODULE_ID}-journal-content .action-buttons .button:hover {
        background: #5a5a50;
      }
      .${MODULE_ID}-journal-content .notes {
        font-size: 0.9em;
        color: #666;
        margin-top: 15px;
        padding-top: 10px;
        border-top: 1px solid #ddd;
      }
    </style>
  `;
}
async function createOrUpdateHandout(url) {
  var _a, _b, _c, _d, _e;
  if (!isGM()) {
    (_a = ui.notifications) == null ? void 0 : _a.warn(localize("notifications.gmOnly"));
    return null;
  }
  const validation = validateUrl(url);
  if (!validation.valid) {
    (_b = ui.notifications) == null ? void 0 : _b.error(validation.error);
    return null;
  }
  const content = createHandoutContent(
    validation.normalized,
    validation.host,
    validation.sessionId
  );
  const handoutName = getHandoutName();
  let journal = findHandoutJournal();
  if (journal) {
    const pages = ((_c = journal.pages) == null ? void 0 : _c.contents) ?? [];
    if (pages.length > 0) {
      await pages[0].update({
        "text.content": content
      });
    } else {
      await journal.createEmbeddedDocuments("JournalEntryPage", [{
        name: "Hacking View",
        type: "text",
        text: { content }
      }]);
    }
    log("Updated journal handout:", handoutName);
    (_d = ui.notifications) == null ? void 0 : _d.info(localize("notifications.journalUpdated"));
  } else {
    journal = await JournalEntry.create({
      name: handoutName,
      pages: [{
        name: "Hacking View",
        type: "text",
        text: { content }
      }],
      ownership: {
        default: 2
        // Observer - players can view
      },
      flags: {
        [MODULE_ID]: {
          isHandout: true,
          url: validation.normalized
        }
      }
    });
    log("Created journal handout:", handoutName);
    (_e = ui.notifications) == null ? void 0 : _e.info(localize("notifications.journalCreated"));
  }
  return journal;
}
let viewerInstance = null;
function getViewerState() {
  if (!viewerInstance) {
    viewerInstance = {
      currentUrl: "",
      iframeLoaded: false,
      lastError: null,
      iframe: null
    };
  }
  return viewerInstance;
}
function prepareViewerContext(options = {}) {
  const state = getViewerState();
  const userIsGM = isGM();
  let url = options.url || state.currentUrl || getCurrentUrl();
  if (!url && !userIsGM) {
    url = getSharedUrl();
  }
  const validation = url ? validateUrl(url) : null;
  return {
    isGM: userIsGM,
    currentUrl: url,
    iframeSrc: (validation == null ? void 0 : validation.valid) ? validation.normalized : "",
    hostDisplay: (validation == null ? void 0 : validation.host) || "",
    sessionDisplay: (validation == null ? void 0 : validation.sessionId) ? formatSessionDisplay(validation.sessionId) : "",
    hasUrl: !!url && !!(validation == null ? void 0 : validation.valid),
    urlError: (validation == null ? void 0 : validation.error) || null,
    iframeLoaded: state.iframeLoaded,
    lastError: state.lastError,
    showDiagnostics: isDiagnosticsEnabled(),
    diagnostics: getDiagnosticsInfo(),
    storageScope: getStorageScope(),
    bridgeConnected: isBridgeConnected()
  };
}
function getDiagnosticsInfo() {
  const state = getViewerState();
  return {
    foundryVersion: getFoundryVersion(),
    moduleVersion: getModuleVersion(),
    currentUrl: state.currentUrl || "(none)",
    iframeLoaded: state.iframeLoaded,
    lastError: state.lastError || void 0,
    bridgeConnected: isBridgeConnected()
  };
}
function handleUrlChange(url) {
  const state = getViewerState();
  state.currentUrl = url;
  state.iframeLoaded = false;
  state.lastError = null;
  log("URL changed:", url);
}
function loadUrl(url, iframe) {
  var _a;
  const validation = validateUrl(url);
  if (!validation.valid) {
    const state2 = getViewerState();
    state2.lastError = validation.error || "Invalid URL";
    (_a = ui.notifications) == null ? void 0 : _a.error(validation.error);
    return false;
  }
  const state = getViewerState();
  state.currentUrl = validation.normalized;
  state.iframeLoaded = false;
  state.lastError = null;
  state.iframe = iframe;
  if (iframe) {
    iframe.src = validation.normalized;
    setIframe(iframe);
  }
  log("Loading URL:", validation.normalized);
  return true;
}
function handleIframeLoad() {
  const state = getViewerState();
  state.iframeLoaded = true;
  state.lastError = null;
  log("Iframe loaded successfully");
}
function handleIframeError(error) {
  const state = getViewerState();
  state.iframeLoaded = false;
  state.lastError = error;
  warn("Iframe error:", error);
}
async function saveToScene() {
  var _a, _b, _c, _d;
  const state = getViewerState();
  if (!state.currentUrl) {
    (_a = ui.notifications) == null ? void 0 : _a.warn(localize("notifications.noUrl"));
    return;
  }
  const scene = (_b = game.scenes) == null ? void 0 : _b.active;
  if (!scene) {
    (_c = ui.notifications) == null ? void 0 : _c.warn(localize("notifications.noScene"));
    return;
  }
  await setSceneUrl(scene, state.currentUrl);
  (_d = ui.notifications) == null ? void 0 : _d.info(localize("notifications.savedToScene"));
}
async function saveToWorld() {
  var _a, _b;
  const state = getViewerState();
  if (!state.currentUrl) {
    (_a = ui.notifications) == null ? void 0 : _a.warn(localize("notifications.noUrl"));
    return;
  }
  await setWorldUrl(state.currentUrl);
  (_b = ui.notifications) == null ? void 0 : _b.info(localize("notifications.savedToWorld"));
}
async function shareCurrentUrl() {
  var _a;
  const state = getViewerState();
  if (!state.currentUrl) {
    (_a = ui.notifications) == null ? void 0 : _a.warn(localize("notifications.noUrl"));
    return;
  }
  await shareToChat(state.currentUrl);
}
async function createHandout() {
  var _a;
  const state = getViewerState();
  if (!state.currentUrl) {
    (_a = ui.notifications) == null ? void 0 : _a.warn(localize("notifications.noUrl"));
    return;
  }
  await createOrUpdateHandout(state.currentUrl);
}
async function copyUrl() {
  var _a, _b, _c;
  const state = getViewerState();
  if (!state.currentUrl) {
    (_a = ui.notifications) == null ? void 0 : _a.warn(localize("notifications.noUrl"));
    return;
  }
  try {
    await navigator.clipboard.writeText(state.currentUrl);
    (_b = ui.notifications) == null ? void 0 : _b.info(localize("notifications.copied"));
  } catch (err) {
    warn("Failed to copy URL:", err);
    (_c = ui.notifications) == null ? void 0 : _c.error(localize("notifications.copyFailed"));
  }
}
function openExternal() {
  var _a;
  const state = getViewerState();
  if (!state.currentUrl) {
    (_a = ui.notifications) == null ? void 0 : _a.warn(localize("notifications.noUrl"));
    return;
  }
  window.open(state.currentUrl, "_blank");
}
function reloadIframe() {
  const state = getViewerState();
  if (state.iframe) {
    state.iframeLoaded = false;
    state.lastError = null;
    state.iframe.src = state.iframe.src;
    log("Iframe reloaded");
  }
}
function clearUrl() {
  const state = getViewerState();
  state.currentUrl = "";
  state.iframeLoaded = false;
  state.lastError = null;
  if (state.iframe) {
    state.iframe.src = "about:blank";
  }
  setIframe(null);
  log("URL cleared");
}
function setViewerIframe(iframe) {
  const state = getViewerState();
  state.iframe = iframe;
  setIframe(iframe);
}
function createViewerAppV2Class() {
  var _a;
  const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
  return _a = class extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(options = {}) {
      super({});
      __publicField(this, "_options");
      this._options = options;
      if (options.url) {
        handleUrlChange(options.url);
      }
    }
    /** Prepare data for the template */
    async _prepareContext(_options = {}) {
      var _a2;
      const context = await ((_a2 = super._prepareContext) == null ? void 0 : _a2.call(this, _options)) ?? {};
      const viewerContext = prepareViewerContext(this._options);
      return foundry.utils.mergeObject(context, viewerContext);
    }
    /** Called after rendering */
    _onRender(_context, _options) {
      this._attachIframeListeners();
      this._attachFormListeners();
    }
    /** Attach iframe event listeners */
    _attachIframeListeners() {
      var _a2;
      const iframe = (_a2 = this.element) == null ? void 0 : _a2.querySelector("iframe");
      if (!iframe) return;
      setViewerIframe(iframe);
      iframe.addEventListener("load", () => {
        handleIframeLoad();
        this.render(false);
      });
      iframe.addEventListener("error", () => {
        handleIframeError("Failed to load iframe");
        this.render(false);
      });
    }
    /** Attach form input listeners */
    _attachFormListeners() {
      var _a2;
      const urlInput = (_a2 = this.element) == null ? void 0 : _a2.querySelector('input[name="url"]');
      if (!urlInput) return;
      urlInput.addEventListener("change", (event) => {
        const target = event.target;
        handleUrlChange(target.value);
      });
      urlInput.addEventListener("keypress", (event) => {
        var _a3;
        if (event.key === "Enter") {
          event.preventDefault();
          const target = event.target;
          const iframe = (_a3 = this.element) == null ? void 0 : _a3.querySelector("iframe");
          loadUrl(target.value, iframe);
          this.render(false);
        }
      });
    }
    // Static action handlers
    static onReload() {
      reloadIframe();
    }
    static async onCopy() {
      await copyUrl();
    }
    static onExternal() {
      openExternal();
    }
    static onLoad() {
      var _a2, _b;
      const urlInput = (_a2 = this.element) == null ? void 0 : _a2.querySelector('input[name="url"]');
      const iframe = (_b = this.element) == null ? void 0 : _b.querySelector("iframe");
      if (urlInput) {
        loadUrl(urlInput.value, iframe);
        this.render(false);
      }
    }
    static async onSaveScene() {
      await saveToScene();
    }
    static async onSaveWorld() {
      await saveToWorld();
    }
    static async onShare() {
      await shareCurrentUrl();
    }
    static async onCreateHandout() {
      await createHandout();
    }
    static onClear() {
      clearUrl();
      this.render(false);
    }
    /** Clean up when closing */
    async close(_options) {
      setViewerIframe(null);
      return super.close(_options);
    }
  }, __publicField(_a, "DEFAULT_OPTIONS", {
    id: `${MODULE_ID}-viewer`,
    classes: [MODULE_ID, "viewer-app"],
    tag: "div",
    window: {
      frame: true,
      positioned: true,
      title: "Hacking Viewer",
      icon: "fa-solid fa-network-wired",
      resizable: true,
      minimizable: true,
      controls: [
        {
          icon: "fa-solid fa-rotate",
          label: "Reload",
          action: "reload"
        },
        {
          icon: "fa-solid fa-copy",
          label: "Copy Link",
          action: "copy"
        },
        {
          icon: "fa-solid fa-external-link-alt",
          label: "Open External",
          action: "external"
        }
      ]
    },
    position: {
      width: 800,
      height: 600
    },
    actions: {
      reload: _a.onReload,
      copy: _a.onCopy,
      external: _a.onExternal,
      load: _a.onLoad,
      saveScene: _a.onSaveScene,
      saveWorld: _a.onSaveWorld,
      share: _a.onShare,
      createHandout: _a.onCreateHandout,
      clear: _a.onClear
    }
  }), __publicField(_a, "PARTS", {
    main: {
      template: `modules/${MODULE_ID}/templates/viewer.hbs`
    }
  }), _a;
}
function createViewerAppV1Class() {
  return class ViewerAppV1 extends Application {
    constructor(options = {}) {
      super({});
      __publicField(this, "_appOptions");
      this._appOptions = options;
      if (options.url) {
        handleUrlChange(options.url);
      }
    }
    static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
        id: `${MODULE_ID}-viewer`,
        classes: [MODULE_ID, "viewer-app"],
        template: `modules/${MODULE_ID}/templates/viewer.hbs`,
        title: "Hacking Viewer",
        width: 800,
        height: 600,
        resizable: true,
        minimizable: true
      });
    }
    /** Get data for the template */
    getData(_options) {
      return prepareViewerContext(this._appOptions);
    }
    /** Called after rendering */
    activateListeners(html) {
      super.activateListeners(html);
      this._attachIframeListeners(html);
      this._attachFormListeners(html);
      this._attachButtonListeners(html);
    }
    /** Attach iframe event listeners */
    _attachIframeListeners(html) {
      const iframe = html.find("iframe")[0];
      if (!iframe) return;
      setViewerIframe(iframe);
      iframe.addEventListener("load", () => {
        handleIframeLoad();
        this.render(false);
      });
      iframe.addEventListener("error", () => {
        handleIframeError("Failed to load iframe");
        this.render(false);
      });
    }
    /** Attach form input listeners */
    _attachFormListeners(html) {
      const urlInput = html.find('input[name="url"]');
      urlInput.on("change", (event) => {
        const target = event.target;
        handleUrlChange(target.value);
      });
      urlInput.on("keypress", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          const target = event.target;
          const iframe = html.find("iframe")[0];
          loadUrl(target.value, iframe);
          this.render(false);
        }
      });
    }
    /** Attach button click listeners */
    _attachButtonListeners(html) {
      html.find('[data-action="load"]').on("click", () => {
        const urlInput = html.find('input[name="url"]')[0];
        const iframe = html.find("iframe")[0];
        if (urlInput) {
          loadUrl(urlInput.value, iframe);
          this.render(false);
        }
      });
      html.find('[data-action="saveScene"]').on("click", async () => {
        await saveToScene();
      });
      html.find('[data-action="saveWorld"]').on("click", async () => {
        await saveToWorld();
      });
      html.find('[data-action="share"]').on("click", async () => {
        await shareCurrentUrl();
      });
      html.find('[data-action="createHandout"]').on("click", async () => {
        await createHandout();
      });
      html.find('[data-action="reload"]').on("click", () => {
        reloadIframe();
      });
      html.find('[data-action="copy"]').on("click", async () => {
        await copyUrl();
      });
      html.find('[data-action="external"]').on("click", () => {
        openExternal();
      });
      html.find('[data-action="clear"]').on("click", () => {
        clearUrl();
        this.render(false);
      });
    }
    /** Add header buttons */
    _getHeaderButtons() {
      const buttons = super._getHeaderButtons();
      buttons.unshift(
        {
          label: "Reload",
          class: "reload",
          icon: "fas fa-rotate",
          onclick: () => reloadIframe()
        },
        {
          label: "Copy",
          class: "copy",
          icon: "fas fa-copy",
          onclick: async () => await copyUrl()
        },
        {
          label: "External",
          class: "external",
          icon: "fas fa-external-link-alt",
          onclick: () => openExternal()
        }
      );
      return buttons;
    }
    /** Clean up when closing */
    async close(options) {
      setViewerIframe(null);
      return super.close(options);
    }
  };
}
let viewerApp = null;
let ViewerAppClass;
function getViewerApp(options = {}) {
  if (options.url) {
    handleUrlChange(options.url);
  }
  if (!viewerApp) {
    viewerApp = new ViewerAppClass(options);
  }
  return viewerApp;
}
function openViewer(url) {
  const app = getViewerApp({ url });
  app.render(true);
}
function registerSceneControls() {
  Hooks.on("getSceneControlButtons", (controls) => {
    const canAccess = isGM() || canPlayersOpen();
    if (!canAccess) return;
    controls.push({
      name: "hacking-viewer",
      title: `${MODULE_ID}.controls.title`,
      icon: "fas fa-network-wired",
      layer: "controls",
      visible: canAccess,
      tools: [
        {
          name: "open-viewer",
          title: `${MODULE_ID}.controls.openViewer`,
          icon: "fas fa-display",
          onClick: () => openViewer(),
          button: true
        }
      ],
      activeTool: "open-viewer"
    });
  });
}
function registerChatHooks() {
  Hooks.on("renderChatMessage", onRenderChatMessage);
}
function registerViewerHooks() {
  Hooks.on(`${MODULE_ID}.openViewer`, (url) => {
    openViewer(url);
  });
}
function registerSheetHooks() {
  Hooks.on("renderActorSheet", (app, html, data) => {
    if (!isGM()) return;
    const header = html.find(".window-header");
    if (header.length && !header.find(".hacking-viewer-btn").length) {
      const btn = $(`
        <a class="hacking-viewer-btn" title="Open Hacking Viewer">
          <i class="fas fa-network-wired"></i>
        </a>
      `);
      btn.on("click", (e) => {
        e.preventDefault();
        openViewer();
      });
      header.find(".window-title").after(btn);
    }
  });
}
Hooks.once("init", () => {
  log("Initializing...");
  registerSettings();
  if (isV12()) {
    log("Using ApplicationV2 (V12)");
    ViewerAppClass = createViewerAppV2Class();
  } else {
    log("Using Application (V11)");
    ViewerAppClass = createViewerAppV1Class();
  }
  log("Initialization complete");
});
Hooks.once("ready", () => {
  log("Ready");
  initBridge();
  setupDefaultHandlers();
  registerSceneControls();
  registerChatHooks();
  registerViewerHooks();
  registerSheetHooks();
  const module = game.modules.get(MODULE_ID);
  if (module) {
    module.api = {
      openViewer,
      getViewerApp: () => viewerApp,
      ViewerAppClass
    };
  }
  log("Module API registered");
});
Hooks.once("close", () => {
  destroyBridge();
  viewerApp = null;
});
export {
  ViewerAppClass,
  getViewerApp,
  openViewer
};
//# sourceMappingURL=module.js.map
