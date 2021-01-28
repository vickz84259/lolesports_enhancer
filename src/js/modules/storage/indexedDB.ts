import { DBSchema, IDBPDatabase, openDB } from 'idb';

const DB_NAME = 'announcersDB';
const OBJ_STORE = 'announcersStore';
const DB_VERSION = 1;


interface AnnnouncersDB extends DBSchema {
  announcersStore: {
    key: string,
    value: ArrayBuffer
  }
}

export type Database = IDBPDatabase<AnnnouncersDB>;


/**
 * Retrieves the default IndexedDB database for storing audio files
 */
export function getDB(): Promise<Database> {
  return openDB<AnnnouncersDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore(OBJ_STORE);
    }
  });
}


/**
 * Retrieves an indexedDB transaction
 *
 * @param db - the IndexedDB database
 * @param readOnly - Whether the transaction is readonly or readwrite
 */
export function getTransaction(db: Database, readOnly = true) {
  const mode = (readOnly) ? 'readonly' : 'readwrite';
  return db.transaction(OBJ_STORE, mode);
}


/**
 * Stores data in the indexedDB databaase and key provided
 *
 * @param db - the indexedDB Database
 * @param value - the audio file data to be saved
 * @param key - the key to be used to reference the data in value
 */
export async function add(db: Database, value: ArrayBuffer, key: string) {
  const transaction = getTransaction(db, false);
  transaction.store.add(value, key);
  await transaction.done;
}


/**
 * Retrieve audio data associated with the given key from the specified
 * indexedDB database
 *
 * @param db - the indexedDB database
 * @param key - the key whose data is to be retrieved
 *
 * @returns ArrayBuffer containing audio data associated with the given key.
 *    Undefined if not found
 */
export async function get(db: Database, key: string) {
  const transaction = getTransaction(db);
  const result = await transaction.store.get(key);
  await transaction.done;

  return result;
}


/**
 * Retrieves all the keys in the default store of an indexedDb database
 *
 * @param db - the indexedDB database
 *
 * @returns all the keys in the given indexedDB database
 */
export async function getAllKeys(db?: Database) {
  if (!db) {
    db = await getDB();
  }
  const transaction = getTransaction(db);
  const result = await transaction.store.getAllKeys();
  await transaction.done;

  return result;
}
