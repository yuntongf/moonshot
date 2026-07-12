import { LoroDoc } from 'loro-crdt';

const DATABASE_NAME = 'moonshot';
const DATABASE_VERSION = 1;
const SNAPSHOTS_STORE = 'prep_snapshots';

export function createPrepDocument(initialText = '') {
  const doc = new LoroDoc();
  const notes = doc.getText('notes');
  if (initialText) notes.insert(0, initialText);
  return { doc, notes };
}

let databasePromise: Promise<IDBDatabase> | undefined;

export function openDatabase(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(SNAPSHOTS_STORE)) {
        db.createObjectStore(SNAPSHOTS_STORE);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return databasePromise;
}

export async function loadSnapshot(documentId: string): Promise<Uint8Array | undefined> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transction = db.transaction([SNAPSHOTS_STORE], "readonly");
    const request = transction.objectStore(SNAPSHOTS_STORE).get(documentId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  })
}

export async function saveSnapshot(documentId: string, document: Uint8Array): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SNAPSHOTS_STORE], "readwrite");
    transaction.objectStore(SNAPSHOTS_STORE).put(document, documentId);

    transaction.oncomplete = () => {
      console.log('completed');
      resolve();
    }
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  })
}
