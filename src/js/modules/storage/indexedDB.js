import { openDB } from 'idb';

const DB_NAME = 'announcersDB';
const OBJ_STORE = 'announcersStore';
const DB_VERSION = 1;

/**
 * @typedef AudioSchema
 * @property {{key: string, value: ArrayBuffer}} announcersStore
 */

/** @typedef {import('idb').IDBPDatabase<AudioSchema>} IDBPDatabase */

/**
 * Retrieves the default IndexedDB database for storing audio files
 *
 * @returns {Promise<IDBPDatabase>}
 */
export function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore(OBJ_STORE);
    }
  });
}


/**
 * Retrieves an indexedDB transaction
 *
 * @param {IDBPDatabase} db - the IndexedDB database
 * @param {boolean} readOnly - Whether the transaction is readonly or readwrite
 *
 * @returns {import('idb').IDBPTransaction<AudioSchema, ["announcersStore"]>}
 */
export function getTransaction(db, readOnly = true) {
  /** @type {IDBTransactionMode} */
  const mode = (readOnly) ? 'readonly' : 'readwrite';
  return db.transaction(OBJ_STORE, mode);
}


/**
 * Stores data in the indexedDB databaase and key provided
 *
 * @param {IDBPDatabase} db - the indexedDB Database
 * @param {ArrayBuffer} value - the audio file data to be saved
 * @param {string} key - the key to be used to reference the data in value
 */
export async function add(db, value, key) {
  const transaction = getTransaction(db, false);
  transaction.store.add(value, key);
  await transaction.done;
}


/**
 * Retrieve audio data associated with the given key from the specified
 * indexedDB database
 *
 * @param {IDBPDatabase} db - the indexedDB database
 * @param {string} key - the key whose data is to be retrieved
 *
 * @returns {Promise<ArrayBuffer>} ArrayBuffer containing audio data associated
 *    with the given key
 */
export async function get(db, key) {
  const transaction = getTransaction(db);
  const result = await transaction.store.get(key);
  await transaction.done;

  return result;
}


/**
 * Retrieves all the keys in the default store of an indexedDb database
 *
 * @param {IDBPDatabase} db - the indexedDB database
 *
 * @returns {Promise<string[]>} all the keys in the given indexedDB database
 */
export async function getAllKeys(db = null) {
  if (!db) {
    db = await getDB();
  }
  const transaction = getTransaction(db);
  const result = await transaction.store.getAllKeys();
  await transaction.done;

  return result;
}
