import { LoroDoc } from 'loro-crdt';

/**
 * The smallest useful Loro boundary. Keep CRDT operations here so UI code
 * deals in product concepts rather than operations and encoded updates.
 */
export function createPrepDocument(initialText = '') {
  const doc = new LoroDoc();
  const notes = doc.getText('notes');
  if (initialText) notes.insert(0, initialText);
  return { doc, notes };
}

// TODO(moonshot-03): persist exported updates to IndexedDB and replay them on
// launch. Then connect the same update stream to the sync Worker.
