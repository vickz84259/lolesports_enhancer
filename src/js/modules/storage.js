import { openDB } from 'idb';

const DB_NAME = 'announcersDB';
const OBJ_STORE = 'announcersStore';
const DB_VERSION = 1;


export async function getDB() {
  return (await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore(OBJ_STORE);
    }
  }));
}

export function getTransaction(db, readOnly = true) {
  let mode = (readOnly) ? 'readonly' : 'readwrite';
  return db.transaction(OBJ_STORE, mode);
}

export async function add(db, value, key) {
  let transaction = getTransaction(db, false);
  transaction.store.add(value, key);
  await transaction.done;
}

export async function getAllKeys(db = null) {
  if (!db) {
    db = await getDB();
  }
  let transaction = getTransaction(db);
  let result = await transaction.store.getAllKeys();
  await transaction.done;

  return result;
}