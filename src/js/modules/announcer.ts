import * as idb from './storage/indexedDB';
import * as storage from './storage/simple';
import * as keys from './storage/keys';
import { getJson } from './utils/resources';

const BASEURL = 'https://d3t82zuq6uoshl.cloudfront.net/';


/**
 * Pads a fileName with the appropriate number of zeros
 */
function getPaddedFileName(fileNumber: number) {
  const padded = fileNumber.toString().padStart(4, '0');
  return `File${padded}.mp3`;
}


/**
 * Async Generator that gets all the filenames for a particular announcer type
 * in a particular locale.
 *
 * @param announcerType - The name of the announcer
 * @param locale - the announcer language locale
 *
 * @yields - a file name
 */
async function* getFileNames(announcerType: string, locale: string) {
  const response = await getJson(`json/${announcerType}.json`);
  const fileNumbers = Object.values(response.categories);

  const fileNoSet = new Set(([] as number[]).concat(...fileNumbers));
  for (const num of fileNoSet) {
    const fileName = getPaddedFileName(num);
    yield `${announcerType}/${locale}/${fileName}`;
  }
}


/**
 * Downloads a file and saves it to disk in an indexedDB database
 *
 * @param fileName - the file to be downloaded
 * @param [db] - The indexedDB database.
 *    If not provided, the default database will be used.
 */
async function download(fileName: string, db?: idb.Database) {
  const url = `${BASEURL}${fileName}`;
  const audioFile = await (await fetch(url)).arrayBuffer();

  if (!db) db = (await idb.getDB());
  await idb.add(db, audioFile, fileName);
}


/**
 * @returns  Promise containing the announcerType and the locale from the
 *    values stored in storage
*/
async function getAnnouncerSettings() {
  const announcerType = await storage.get(keys.ANNOUNCER_TYPE) as string;
  const locale = await storage.get(keys.ANNOUNCER_LANG) as string;

  return { announcerType, locale };
}


/**
 * Checks for any missing audio files and downloads them
 */
export async function checkFiles() {
  const db = await idb.getDB();
  const savedFiles = await idb.getAllKeys(db);

  const promises: Promise<void>[] = [];

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
 * specifies the various announcer scenarios and the file names for each
 * particular scenario
 */
export interface AnnouncerScenarioFiles {
  [key: string]: string[]
}


/**
 * Retrieves the announcer's scenarios from the respective json resource file
 */
export async function getScenarios() {
  const settings = await getAnnouncerSettings();
  const response = await getJson(`json/${settings.announcerType}.json`);

  const scenarios = response.categories;
  const named_scenarios: AnnouncerScenarioFiles = {};

  for (const key in scenarios) {
    named_scenarios[key] = scenarios[key].map(item => {
      const fileName = getPaddedFileName(item);
      return `${settings.announcerType}/${settings.locale}/${fileName}`;
    });
  }
  return named_scenarios;
}

/**
 * Retrieves the audio files saved on disk based on the current user settings.
 *
 * @yields Object containing the file name and the audio data associated with it
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
