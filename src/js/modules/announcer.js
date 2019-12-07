import * as idb from './storage/indexedDB.js';
import * as storage from './storage/simple.js';
import * as keys from './storage/keys.js';
import { getJson } from './utils/resources.js';

const BASEURL = 'https://d3t82zuq6uoshl.cloudfront.net/';


/**
 * Pads a fileName with the appropriate number of zeros
 *
 * @param {number} fileNumber
 *
 * @returns {string} file name with the padded file number
 */
function getPaddedFileName(fileNumber) {
  const padded = fileNumber.toString().padStart(4, '0');
  return `File${padded}.mp3`;
}


/**
 * Async Generator that gets all the filenames for a particular announcer type
 * in a particular locale.
 *
 * @param {string} announcerType - The name of the announcer
 * @param {string} locale - the announcer language locale
 *
 * @returns {AsyncGenerator<string, void, unknown>}
 * @yields {string} - a file name
 */
async function* getFileNames(announcerType, locale) {
  const response = await getJson(`json/${announcerType}.json`);
  const fileNumbers = Object.values(response.categories);

  /** @type {Set<number>} */
  const fileNoSet = new Set([].concat(...fileNumbers));
  for (const num of fileNoSet) {
    const fileName = getPaddedFileName(num);
    yield `${announcerType}/${locale}/${fileName}`;
  }
}


/**
 * Downloads a file and saves it to disk in an indexedDB database
 *
 * @param {string} fileName - the file to be downloaded
 * @param {?idb.IDBPDatabase} [db] - The indexedDB database.
 *    If not provided, the default database will be used.
 */
async function download(fileName, db = null) {
  const url = `${BASEURL}${fileName}`;
  const audioFile = await (await fetch(url)).arrayBuffer();

  if (!db) db = (await idb.getDB());
  await idb.add(db, audioFile, fileName);
}


/**
 * @returns {Promise<{announcerType: string, locale: string}>} Promise
 *    containing the announcerType and the locale from the values stored in
 *    storage
*/
async function getAnnouncerSettings() {
  const announcerType = await storage.get(keys.ANNOUNCER_TYPE);
  const locale = await storage.get(keys.ANNOUNCER_LANG);

  return { announcerType, locale };
}


/**
 * Checks for any missing audio files and downloads them
 */
export async function checkFiles() {
  const db = await idb.getDB();
  const savedFiles = await idb.getAllKeys(db);

  /** @type {Promise[]} */
  const promises = [];

  const settings = await getAnnouncerSettings();
  const fileNames = getFileNames(settings.announcerType, settings.locale);
  for await (const fileName of fileNames) {
    if (!(savedFiles.includes(fileName))) {
      console.log(`downloading ${fileName}`);
      promises.push(download(fileName, db));
    }
  }

  await Promise.all(promises);
}


/**
 * Retrieves the announcer's scenarios from the respective json resource file
 *
 * @returns {Promise<Object.<string, string[]>>}
 */
export async function getScenarios() {
  const settings = await getAnnouncerSettings();
  const response = await getJson(`json/${settings.announcerType}.json`);

  /** @type {Object.<string, (string | number)[]>} */
  const scenarios = response.categories;

  for (const key in scenarios) {
    scenarios[key] = scenarios[key].map(/** @param {number} item */item => {
      const fileName = getPaddedFileName(item);
      return `${settings.announcerType}/${settings.locale}/${fileName}`;
    });
  }
  return /** @type {Object.<string, string[]>} */ (scenarios);
}

/**
 * Retrieves the audio files saved on disk based on the current user settings.
 *
 * @returns {AsyncGenerator<{fileName: string, data: ArrayBuffer}, void,
 *    unknown>}
 * @yields {{fileName: string, data: ArrayBuffer}} Object containing the file
 *  name and the audio data associated with it
 */
export async function* getAudioFiles() {
  const db = await idb.getDB();

  const settings = await getAnnouncerSettings();
  const fileNames = getFileNames(settings.announcerType, settings.locale);
  for await (const fileName of fileNames) {
    const data = await idb.get(db, fileName);
    yield { fileName, data };
  }
}
