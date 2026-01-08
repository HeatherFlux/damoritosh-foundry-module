/**
 * Journal handout service
 * Creates and updates journal entries with hacking view links
 */

import { MODULE_ID } from '../types';
import { log, isGM, localize } from '../compat';
import { getSetting } from './storage';
import { validateUrl, formatSessionDisplay } from './url';

/**
 * Get the configured handout name
 */
export function getHandoutName(): string {
  return getSetting<string>('journalHandoutName') || 'Hacking Network';
}

/**
 * Find existing journal entry by name
 */
function findHandoutJournal(): unknown {
  const name = getHandoutName();
  // @ts-expect-error - Foundry global
  return game.journal?.getName(name);
}

/**
 * Create the HTML content for the journal page
 */
function createHandoutContent(url: string, host: string, sessionId?: string): string {
  const sessionDisplay = formatSessionDisplay(sessionId);

  return `
    <div class="${MODULE_ID}-journal-content">
      <h2><i class="fas fa-network-wired"></i> Hacking Network View</h2>

      <div class="info-section">
        <p><strong>Host:</strong> ${host}</p>
        ${sessionDisplay ? `<p><strong>Session:</strong> <code>${sessionDisplay}</code></p>` : ''}
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

/**
 * Create or update a journal handout with the hacking view URL
 */
export async function createOrUpdateHandout(url: string): Promise<unknown> {
  if (!isGM()) {
    // @ts-expect-error - Foundry global
    ui.notifications?.warn(localize('notifications.gmOnly'));
    return null;
  }

  const validation = validateUrl(url);
  if (!validation.valid) {
    // @ts-expect-error - Foundry global
    ui.notifications?.error(validation.error);
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
    // Update existing journal
    // @ts-expect-error - Foundry journal
    const pages = journal.pages?.contents ?? [];
    if (pages.length > 0) {
      // Update first page
      // @ts-expect-error - Foundry journal page
      await pages[0].update({
        'text.content': content
      });
    } else {
      // Add a page if none exist
      // @ts-expect-error - Foundry journal
      await journal.createEmbeddedDocuments('JournalEntryPage', [{
        name: 'Hacking View',
        type: 'text',
        text: { content }
      }]);
    }

    log('Updated journal handout:', handoutName);
    // @ts-expect-error - Foundry global
    ui.notifications?.info(localize('notifications.journalUpdated'));
  } else {
    // Create new journal
    // @ts-expect-error - Foundry global
    journal = await JournalEntry.create({
      name: handoutName,
      pages: [{
        name: 'Hacking View',
        type: 'text',
        text: { content }
      }],
      ownership: {
        default: 2 // Observer - players can view
      },
      flags: {
        [MODULE_ID]: {
          isHandout: true,
          url: validation.normalized
        }
      }
    });

    log('Created journal handout:', handoutName);
    // @ts-expect-error - Foundry global
    ui.notifications?.info(localize('notifications.journalCreated'));
  }

  return journal;
}

/**
 * Delete the handout journal if it exists
 */
export async function deleteHandout(): Promise<void> {
  if (!isGM()) {
    return;
  }

  const journal = findHandoutJournal();
  if (journal) {
    // @ts-expect-error - Foundry journal
    await journal.delete();
    log('Deleted journal handout');
    // @ts-expect-error - Foundry global
    ui.notifications?.info(localize('notifications.journalDeleted'));
  }
}

/**
 * Open the handout journal for viewing
 */
export function openHandout(): void {
  const journal = findHandoutJournal();
  if (journal) {
    // @ts-expect-error - Foundry journal
    journal.sheet?.render(true);
  } else {
    // @ts-expect-error - Foundry global
    ui.notifications?.warn(localize('notifications.noHandout'));
  }
}

/**
 * Check if handout exists
 */
export function handoutExists(): boolean {
  return !!findHandoutJournal();
}
